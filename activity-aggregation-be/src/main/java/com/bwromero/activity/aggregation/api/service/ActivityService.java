package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.QActivity;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.bwromero.activity.aggregation.api.model.ActivityResponse;
import jakarta.persistence.EntityManager;
import java.util.*;
import java.util.stream.Collectors;
import com.querydsl.core.types.Expression;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;
    private final jakarta.persistence.EntityManager entityManager;

    @Cacheable(value = "activities", key = "T(java.util.Objects).hash(#groupBy, #pageable.pageNumber, #pageable.pageSize)")
    public Page<ActivityResponse> getAggregatedActivities(List<String> groupBy, Pageable pageable) {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        QActivity activity = QActivity.activity;

        Set<String> groups = groupBy == null ? Set.of() :
                groupBy.stream().map(String::toLowerCase).collect(Collectors.toSet());

        // 1. Use the specific Expression interface for the list
        List<Expression<?>> groupList = new ArrayList<>();
        if (groups.contains("project")) {
            groupList.add((Expression<?>) activity.project.name);
        }
        if (groups.contains("employee")) {
            groupList.add((Expression<?>) activity.employee.name);
        }
        if (groups.contains("date")) {
            groupList.add((Expression<?>) activity.date);
        }


        // 2. Build the main query
        // If no groups are selected, we show all fields (raw data)
        boolean noGrouping = groups.isEmpty();

        JPAQuery<ActivityResponse> query = queryFactory
                .select(Projections.constructor(ActivityResponse.class,
                        (noGrouping || groups.contains("project")) ? activity.project.name : Expressions.nullExpression(String.class),
                        (noGrouping || groups.contains("employee")) ? activity.employee.name : Expressions.nullExpression(String.class),
                        (noGrouping || groups.contains("date")) ? activity.date.stringValue() : Expressions.nullExpression(String.class),
                        activity.hours.sum().castToNum(Integer.class)
                ))
                .from(activity);

        // Apply groupBy
        if (!noGrouping) {
            query.groupBy(groupList.toArray(new Expression[0]));
        } else {
            // To avoid SQL grammar errors, we group by the ID AND the fields we are selecting.
            // This ensures every column in the SELECT is accounted for in the GROUP BY.
            query.groupBy(
                    activity.id,
                    activity.project.name,
                    activity.employee.name,
                    activity.date
            );
        }

        // Execute query to get the content
        List<ActivityResponse> content = query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 3. Robust Total Count
        long total;
        if (noGrouping) {
            // If we aren't grouping, the total is just the total number of records
            total = repository.count();
        } else {
            // When grouping, the total is the number of resulting groups.
            // We count how many unique combinations of the group fields exist.
            total = queryFactory
                    .select(activity.id.count()) 
                    .from(activity)
                    .groupBy(groupList.toArray(new Expression[0]))
                    .fetch().size();
        }

        return new PageImpl<>(content, pageable, total);
    }
}
