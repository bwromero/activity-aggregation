package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.ActivityResponse;
import com.bwromero.activity.aggregation.api.model.QActivity;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class ActivityRepositoryImpl implements ActivityRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<ActivityResponse> findAggregatedDynamic(List<String> groupBy, Pageable pageable) {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        QActivity activity = QActivity.activity;

        // 1. Prepare Paths and Groups
        Expression<java.sql.Date> dateDayPath = Expressions.dateTimeTemplate(java.sql.Date.class, "CAST({0} AS date)", activity.date);
        Map<String, Expression<?>> pathMap = createPathMap(activity, dateDayPath);
        List<Expression<?>> groupExpressions = resolveGroupExpressions(groupBy, pathMap);
        Set<String> activeGroups = resolveActiveGroupNames(groupBy);

        // 2. Build Query with Dynamic Projection
        JPAQuery<ActivityResponse> query = queryFactory
                .select(createProjection(activity, dateDayPath, activeGroups))
                .from(activity);

        // 3. Apply Grouping
        applyGrouping(query, activity, dateDayPath, groupExpressions);

        // 4. Apply Sorting
        applySorting(query, activity, pageable, pathMap, groupExpressions);

        // 5. Execute and Return Page
        long total = calculateTotal(queryFactory, activity, groupExpressions);
        List<ActivityResponse> content = query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(content, pageable, total);
    }

    private Map<String, Expression<?>> createPathMap(QActivity activity, Expression<java.sql.Date> dateDayPath) {
        return Map.of(
                "project", activity.project.name,
                "employee", activity.employee.name,
                "date", dateDayPath
        );
    }

    private List<Expression<?>> resolveGroupExpressions(List<String> groupBy, Map<String, Expression<?>> pathMap) {
        if (groupBy == null) return Collections.emptyList();
        return groupBy.stream()
                .map(String::toLowerCase)
                .filter(pathMap::containsKey)
                .map(pathMap::get)
                .distinct()
                .collect(Collectors.toList());
    }

    private Set<String> resolveActiveGroupNames(List<String> groupBy) {
        if (groupBy == null) return Collections.emptySet();
        return groupBy.stream().map(String::toLowerCase).collect(Collectors.toSet());
    }

    private Expression<ActivityResponse> createProjection(QActivity activity, Expression<java.sql.Date> dateDayPath, Set<String> activeGroups) {
        boolean showAll = activeGroups.isEmpty();
        
        Expression<String> projectExpr = (showAll || activeGroups.contains("project")) ? activity.project.name : Expressions.nullExpression(String.class);
        Expression<String> employeeExpr = (showAll || activeGroups.contains("employee")) ? activity.employee.name : Expressions.nullExpression(String.class);
        Expression<java.sql.Date> dateExpr = (showAll || activeGroups.contains("date")) ? dateDayPath : Expressions.nullExpression(java.sql.Date.class);

        return Projections.constructor(ActivityResponse.class,
                projectExpr,
                employeeExpr,
                dateExpr,
                activity.hours.sum().castToNum(Integer.class)
        );
    }

    private void applyGrouping(JPAQuery<?> query, QActivity activity, Expression<java.sql.Date> dateDayPath, List<Expression<?>> groupExpressions) {
        if (!groupExpressions.isEmpty()) {
            query.groupBy(groupExpressions.toArray(new Expression[0]));
        } else {
            // Default flattened view grouping
            query.groupBy(activity.id, activity.project.name, activity.employee.name, dateDayPath);
        }
    }

    private void applySorting(JPAQuery<?> query, QActivity activity, Pageable pageable,
                                    Map<String, Expression<?>> pathMap, List<Expression<?>> groupExpressions) {
        Sort sort = pageable.getSort();
        if (sort.isSorted()) {
            for (Sort.Order order : sort) {
                String prop = order.getProperty().toLowerCase();
                Order direction = order.isAscending() ? Order.ASC : Order.DESC;

                if (prop.equals("hours")) {
                    query.orderBy(new OrderSpecifier<>(direction, activity.hours.sum()));
                } else if (pathMap.containsKey(prop)) {
                    Expression<?> path = pathMap.get(prop);
                    // Standard SQL Rule: Cannot sort by a column that is not grouped or aggregated
                    if (groupExpressions.isEmpty() || groupExpressions.contains(path)) {
                        query.orderBy(new OrderSpecifier(direction, path));
                    }
                }
            }
        } else {
            // Default Sort: Use selected hierarchy or fallback to date
            if (!groupExpressions.isEmpty()) {
                groupExpressions.forEach(expr -> query.orderBy(new OrderSpecifier(Order.ASC, expr)));
            } else {
                query.orderBy(activity.date.desc());
            }
        }
    }

    private long calculateTotal(JPAQueryFactory queryFactory, QActivity activity, List<Expression<?>> groupExpressions) {
        if (groupExpressions.isEmpty()) {
            return queryFactory.select(activity.count()).from(activity).fetchOne();
        }
        // Size of the result set of the grouped query
        return queryFactory
                .select(activity.id.count())
                .from(activity)
                .groupBy(groupExpressions.toArray(new Expression[0]))
                .fetchCount();
    }
}