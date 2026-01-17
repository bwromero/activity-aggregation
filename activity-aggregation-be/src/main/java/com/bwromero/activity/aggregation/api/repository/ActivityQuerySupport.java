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
import lombok.experimental.UtilityClass;
import org.springframework.data.domain.Sort;

import java.sql.Date;
import java.util.*;
import java.util.stream.Collectors;

/**
 * High-level QueryDSL support for Activity aggregations.
 * Optimized for clean readability and strict SQL compliance.
 */
@UtilityClass
public class ActivityQuerySupport {

    public static Map<String, Expression<?>> createPathMap(QActivity activity, Expression<java.sql.Date> dateDayPath) {
        return Map.of(
                "project", activity.project.name,
                "employee", activity.employee.name,
                "date", dateDayPath
        );
    }

    public static List<Expression<?>> resolveGroupExpressions(List<String> groupBy, Map<String, Expression<?>> pathMap) {
        return Optional.ofNullable(groupBy).orElse(Collections.emptyList()).stream()
                .map(String::toLowerCase)
                .map(pathMap::get)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    public static Set<String> resolveActiveGroupNames(List<String> groupBy) {
        return Optional.ofNullable(groupBy).orElse(Collections.emptyList()).stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    public static void applyGrouping(JPAQuery<?> query, QActivity activity, Expression<Date> dateDayPath, List<Expression<?>> groups) {
        if (!groups.isEmpty()) {
            query.groupBy(groups.toArray(Expression[]::new));
        } else {
            // Flattened view grouping
            query.groupBy(activity.id, activity.project.name, activity.employee.name, dateDayPath);
        }
    }

    public static void applySorting(JPAQuery<?> query, QActivity activity, Sort sort, 
                                    Map<String, Expression<?>> pathMap, List<Expression<?>> groups) {
        if (sort.isSorted()) {
            for (Sort.Order order : sort) {
                applySingleSort(query, activity, order, pathMap, groups);
            }
        } else {
            applyDefaultSort(query, activity, groups);
        }
    }

    private static void applySingleSort(JPAQuery<?> query, QActivity activity, Sort.Order order, 
                                        Map<String, Expression<?>> pathMap, List<Expression<?>> groups) {
        String prop = order.getProperty().toLowerCase();
        Order direction = order.isAscending() ? Order.ASC : Order.DESC;

        if (prop.equals("hours")) {
            Expression<Integer> hours = groups.isEmpty() ? activity.hours : activity.hours.sum().castToNum(Integer.class);
            query.orderBy(new OrderSpecifier<>(direction, hours));
        } else if (pathMap.containsKey(prop)) {
            Expression<?> path = pathMap.get(prop);
            if (groups.isEmpty() || isPathInGroups(path, groups)) {
                query.orderBy(new OrderSpecifier(direction, path));
            }
        }
    }

    private static void applyDefaultSort(JPAQuery<?> query, QActivity activity, List<Expression<?>> groups) {
        if (!groups.isEmpty()) {
            groups.forEach(expr -> query.orderBy(new OrderSpecifier(Order.ASC, expr)));
        } else {
            query.orderBy(activity.date.desc());
        }
    }

    public static Expression<ActivityResponse> createProjection(QActivity activity, Expression<Date> dateDayPath, Set<String> active) {
        return Projections.constructor(ActivityResponse.class,
                projectField(active, "project", activity.project.name, String.class),
                projectField(active, "employee", activity.employee.name, String.class),
                projectField(active, "date", dateDayPath, Date.class),
                activity.hours.sum().castToNum(Integer.class)
        );
    }

    private static <T> Expression<T> projectField(Set<String> active, String name, Expression<T> path, Class<T> type) {
        return (active.isEmpty() || active.contains(name)) ? path : Expressions.nullExpression(type);
    }

    public static long calculateTotal(JPAQueryFactory queryFactory, QActivity activity, List<Expression<?>> groups) {
        if (groups.isEmpty()) {
            return Optional.ofNullable(queryFactory.select(activity.count()).from(activity).fetchOne()).orElse(0L);
        }
        return queryFactory.select(Expressions.asNumber(1))
                .from(activity)
                .groupBy(groups.toArray(Expression[]::new))
                .fetch().size();
    }

    private static boolean isPathInGroups(Expression<?> path, List<Expression<?>> groups) {
        return groups.stream().anyMatch(g -> g.equals(path) || g.toString().equals(path.toString()));
    }
}
