package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.Activity;
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

import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class ActivityRepositoryImpl implements ActivityRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<ActivityResponse> findAggregatedDynamic(List<String> groupBy, Pageable pageable) {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        QActivity activity = QActivity.activity;

        // 1. Define a mapping between Request Strings and the actual QueryDSL Path instances.
        // This ensures the EXACT SAME object is used in SELECT, GROUP BY, and ORDER BY.
        Map<String, Expression<?>> pathMap = Map.of(
                "project", activity.project.name,
                "employee", activity.employee.name,
                "date", activity.date
        );

        Set<String> activeGroups = (groupBy == null) ? Collections.emptySet() :
                groupBy.stream().map(String::toLowerCase).collect(Collectors.toSet());

        // 2. Build dynamic Group List based on mapping
        List<Expression<?>> groupExpressions = activeGroups.stream()
                .filter(pathMap::containsKey)
                .map(pathMap::get)
                .collect(Collectors.toList());

        // 3. Define Projections based on the group context
        // If no grouping is requested, we show all data (flattened view).
        boolean showAll = activeGroups.isEmpty();
        Expression<String> projectExpr = (showAll || activeGroups.contains("project")) ? activity.project.name : Expressions.nullExpression(String.class);
        Expression<String> employeeExpr = (showAll || activeGroups.contains("employee")) ? activity.employee.name : Expressions.nullExpression(String.class);
        Expression<ZonedDateTime> dateExpr = (showAll || activeGroups.contains("date")) ? activity.date : Expressions.nullExpression(ZonedDateTime.class);

        JPAQuery<ActivityResponse> query = queryFactory
                .select(Projections.constructor(ActivityResponse.class,
                        projectExpr,
                        employeeExpr,
                        dateExpr,
                        activity.hours.sum().castToNum(Integer.class)
                ))
                .from(activity);

        // 4. Apply Grouping
        if (!groupExpressions.isEmpty()) {
            query.groupBy(groupExpressions.toArray(new Expression[0]));
        } else {
            // Default "Flattened" view grouping - includes the date path directly
            query.groupBy(activity.id, activity.project.name, activity.employee.name, activity.date);
        }

        // 5. Apply Sorting (Type-Safe and Group-Aware)
        applyModernSorting(query, activity, pageable, pathMap, groupExpressions);

        List<ActivityResponse> content = query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(content, pageable, calculateTotal(queryFactory, activity, groupExpressions));
    }

    private void applyModernSorting(JPAQuery<?> query, QActivity activity, Pageable pageable,
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
            // Default Sort: Sort by the first grouping column, or date desc for flat lists
            if (!groupExpressions.isEmpty()) {
                query.orderBy(new OrderSpecifier(Order.ASC, groupExpressions.get(0)));
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
                .fetch().size();
    }
}