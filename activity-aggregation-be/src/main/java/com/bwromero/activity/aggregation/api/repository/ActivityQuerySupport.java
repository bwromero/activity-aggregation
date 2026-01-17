package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.dto.ActivityResponse;
import com.bwromero.activity.aggregation.api.model.QActivity;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.data.domain.Sort;

import java.util.*;
import java.util.stream.Collectors;

public class ActivityQuerySupport {

    public static Map<String, Expression<?>> createPathMap(QActivity activity, Expression<java.sql.Date> dateDayPath) {
        return Map.of(
                "project", activity.project.name,
                "employee", activity.employee.name,
                "date", dateDayPath
        );
    }

    public static List<Expression<?>> resolveGroupExpressions(List<String> groupBy, Map<String, Expression<?>> pathMap) {
        if (groupBy == null) return Collections.emptyList();
        return groupBy.stream()
                .map(String::toLowerCase)
                .filter(pathMap::containsKey)
                .map(pathMap::get)
                .distinct()
                .collect(Collectors.toList());
    }

    public static Set<String> resolveActiveGroupNames(List<String> groupBy) {
        if (groupBy == null) return Collections.emptySet();
        return groupBy.stream().map(String::toLowerCase).collect(Collectors.toSet());
    }

    public static void applyGrouping(JPAQuery<?> query, QActivity activity, Expression<java.sql.Date> dateDayPath, List<Expression<?>> groupExpressions) {
        if (!groupExpressions.isEmpty()) {
            query.groupBy(groupExpressions.toArray(new Expression[0]));
        } else {
            query.groupBy(activity.id, activity.project.name, activity.employee.name, dateDayPath);
        }
    }

    public static void applySorting(JPAQuery<?> query, QActivity activity, Sort sort, 
                                    Map<String, Expression<?>> pathMap, List<Expression<?>> groupExpressions) {
        if (sort.isSorted()) {
            for (Sort.Order order : sort) {
                String prop = order.getProperty().toLowerCase();
                Order direction = order.isAscending() ? Order.ASC : Order.DESC;

                if (prop.equals("hours")) {
                    Expression<Integer> hoursExpr = groupExpressions.isEmpty() 
                            ? activity.hours 
                            : activity.hours.sum().castToNum(Integer.class);
                    query.orderBy(new OrderSpecifier<>(direction, hoursExpr));
                } else if (pathMap.containsKey(prop)) {
                    Expression<?> path = pathMap.get(prop);
                    if (groupExpressions.isEmpty() || isPathInGroups(path, groupExpressions)) {
                        query.orderBy(new OrderSpecifier(direction, path));
                    }
                }
            }
        } else {
            if (!groupExpressions.isEmpty()) {
                groupExpressions.forEach(expr -> query.orderBy(new OrderSpecifier(Order.ASC, expr)));
            } else {
                query.orderBy(activity.date.desc());
            }
        }
    }

    public static long calculateTotal(JPAQueryFactory queryFactory, QActivity activity, List<Expression<?>> groupExpressions) {
        if (groupExpressions.isEmpty()) {
            // Flattened view count: simple row count
            Long count = queryFactory.select(activity.count()).from(activity).fetchOne();
            return count != null ? count : 0L;
        }
        
        // Grouped view count: how many unique groups exist
        // To avoid the "computed in memory" warning, we select the count of a constant 
        // effectively counting the number of rows produced by the GROUP BY
        return queryFactory
                .select(Expressions.asNumber(1))
                .from(activity)
                .groupBy(groupExpressions.toArray(new Expression[0]))
                .fetch().size();
    }

    public static Expression<ActivityResponse> createProjection(QActivity activity, Expression<java.sql.Date> dateDayPath, Set<String> activeGroups) {
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

    private static boolean isPathInGroups(Expression<?> path, List<Expression<?>> groupExpressions) {
        return groupExpressions.stream().anyMatch(g -> g.equals(path) || g.toString().equals(path.toString()));
    }
}
