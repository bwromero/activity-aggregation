package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.QActivity;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.bwromero.activity.aggregation.api.model.ActivityResponse;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;
    private final jakarta.persistence.EntityManager entityManager;

    @Cacheable(value = "activities", key = "T(java.util.Objects).hash(#groupBy, #pageable.pageNumber, #pageable.pageSize, #pageable.sort.toString())")
    public Page<ActivityResponse> getAggregatedActivities(List<String> groupBy, Pageable pageable) {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        QActivity activity = QActivity.activity;

        // 1. Identify which groups are active
        List<String> activeGroups = groupBy == null ? List.of() : groupBy;
        Set<String> groupsSet = activeGroups.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        
        boolean noGrouping = groupsSet.isEmpty();

        // 2. Build the group list for the SQL GROUP BY clause
        List<Expression<?>> groupList = new ArrayList<>();
        if (groupsSet.contains("project")) groupList.add(activity.project.name);
        if (groupsSet.contains("employee")) groupList.add(activity.employee.name);
        if (groupsSet.contains("date")) groupList.add(activity.date);

        // 3. Build the Select Query
        JPAQuery<ActivityResponse> query = queryFactory
                .select(Projections.constructor(ActivityResponse.class,
                        (noGrouping || groupsSet.contains("project")) ? activity.project.name : Expressions.nullExpression(String.class),
                        (noGrouping || groupsSet.contains("employee")) ? activity.employee.name : Expressions.nullExpression(String.class),
                        (noGrouping || groupsSet.contains("date")) ? activity.date.stringValue() : Expressions.nullExpression(String.class),
                        activity.hours.sum().castToNum(Integer.class)
                ))
                .from(activity);

        // 4. Apply Sorting
        if (pageable.getSort().isSorted()) {
            // User-defined sorting from the table headers
            pageable.getSort().forEach(order -> {
                if (order.getProperty().equalsIgnoreCase("hours")) {
                    query.orderBy(new OrderSpecifier(order.isAscending() ? Order.ASC : Order.DESC, activity.hours.sum()));
                } else {
                    PathBuilder<Activity> entityPath = new PathBuilder<>(Activity.class, "activity");
                    String prop = order.getProperty();
                    if (prop.equals("project")) prop = "project.name";
                    if (prop.equals("employee")) prop = "employee.name";
                    query.orderBy(new OrderSpecifier(order.isAscending() ? Order.ASC : Order.DESC, entityPath.get(prop)));
                }
            });
        } else if (!noGrouping) {
            // Default UX Sort: Sort by grouping fields in the order they were selected
            for (String group : activeGroups) {
                String field = group.toLowerCase();
                if (field.equals("project")) query.orderBy(activity.project.name.asc());
                else if (field.equals("employee")) query.orderBy(activity.employee.name.asc());
                else if (field.equals("date")) query.orderBy(activity.date.asc());
            }
        } else {
            // Default Raw Data Sort: Show most recent activities first
            query.orderBy(activity.date.desc());
        }

        // 5. Apply Grouping
        if (!noGrouping) {
            query.groupBy(groupList.toArray(new Expression[0]));
        } else {
            // Group by ID and projected fields to satisfy Postgres for raw data view
            query.groupBy(activity.id, activity.project.name, activity.employee.name, activity.date);
        }

        // 6. Execute Paginated Data Fetch
        List<ActivityResponse> content = query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 7. Calculate Total Count
        long total;
        if (noGrouping) {
            total = repository.count();
        } else {
            // Count the number of unique groups formed
            total = queryFactory
                    .select(activity.id.count()) // or activity.count()
                    .from(activity)
                    .groupBy(groupList.toArray(new Expression[0]))
                    .fetch()
                    .size();
        }

        return new PageImpl<>(content, pageable, total);
    }
}
