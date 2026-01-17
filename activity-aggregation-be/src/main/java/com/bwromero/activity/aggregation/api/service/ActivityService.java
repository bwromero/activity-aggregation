package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.ActivityResponse;
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
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;
    private final EntityManager entityManager;

    @Cacheable(value = "activities", key = "T(java.util.Objects).hash(#groupBy, #pageable.pageNumber, #pageable.pageSize, #pageable.sort.toString())")
    public Page<ActivityResponse> getAggregatedActivities(List<String> groupBy, Pageable pageable) {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        QActivity activity = QActivity.activity;

        Set<String> groupsSet = normalizeGroups(groupBy);
        boolean noGrouping = groupsSet.isEmpty();
        List<Expression<?>> groupList = buildGroupList(activity, groupsSet);

        // 1. Build Base Query
        JPAQuery<ActivityResponse> query = queryFactory
                .select(Projections.constructor(ActivityResponse.class,
                        (noGrouping || groupsSet.contains("project")) ? activity.project.name : Expressions.nullExpression(String.class),
                        (noGrouping || groupsSet.contains("employee")) ? activity.employee.name : Expressions.nullExpression(String.class),
                        (noGrouping || groupsSet.contains("date")) ? activity.date.stringValue() : Expressions.nullExpression(String.class),
                        activity.hours.sum().castToNum(Integer.class)
                ))
                .from(activity);

        // 2. Apply Grouping & Sorting
        applyGrouping(query, activity, noGrouping, groupList);
        applySorting(query, activity, pageable, groupBy, noGrouping);

        // 3. Execute and Count
        List<ActivityResponse> content = query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(content, pageable, calculateTotal(queryFactory, activity, noGrouping, groupList));
    }

    private Set<String> normalizeGroups(List<String> groupBy) {
        if (groupBy == null) return Collections.emptySet();
        return groupBy.stream().map(String::toLowerCase).collect(Collectors.toSet());
    }

    private List<Expression<?>> buildGroupList(QActivity activity, Set<String> groupsSet) {
        List<Expression<?>> groupList = new ArrayList<>();
        if (groupsSet.contains("project")) groupList.add(activity.project.name);
        if (groupsSet.contains("employee")) groupList.add(activity.employee.name);
        if (groupsSet.contains("date")) groupList.add(activity.date);
        return groupList;
    }

    private void applyGrouping(JPAQuery<?> query, QActivity activity, boolean noGrouping, List<Expression<?>> groupList) {
        if (!noGrouping) {
            query.groupBy(groupList.toArray(new Expression[0]));
        } else {
            query.groupBy(activity.id, activity.project.name, activity.employee.name, activity.date);
        }
    }

    private void applySorting(JPAQuery<?> query, QActivity activity, Pageable pageable, List<String> originalGroups, boolean noGrouping) {
        if (pageable.getSort().isSorted()) {
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
            for (String group : originalGroups) {
                String field = group.toLowerCase();
                if (field.equals("project")) query.orderBy(activity.project.name.asc());
                else if (field.equals("employee")) query.orderBy(activity.employee.name.asc());
                else if (field.equals("date")) query.orderBy(activity.date.asc());
            }
        } else {
            query.orderBy(activity.date.desc());
        }
    }

    private long calculateTotal(JPAQueryFactory queryFactory, QActivity activity, boolean noGrouping, List<Expression<?>> groupList) {
        if (noGrouping) {
            return repository.count();
        }
        return queryFactory
                .select(activity.id.count())
                .from(activity)
                .groupBy(groupList.toArray(new Expression[0]))
                .fetch().size();
    }
}
