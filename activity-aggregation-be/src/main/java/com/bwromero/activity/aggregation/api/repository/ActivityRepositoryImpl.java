package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.dto.ActivityResponse;
import com.bwromero.activity.aggregation.api.model.QActivity;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static com.bwromero.activity.aggregation.api.repository.ActivityQuerySupport.*;

@RequiredArgsConstructor
public class ActivityRepositoryImpl implements ActivityRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<ActivityResponse> findAggregatedDynamic(List<String> groupBy, Pageable pageable) {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        QActivity activity = QActivity.activity;

        Expression<java.sql.Date> dateDayPath = Expressions.dateTimeTemplate(java.sql.Date.class, "CAST({0} AS date)", activity.date);

        Map<String, Expression<?>> pathMap = createPathMap(activity, dateDayPath);
        List<Expression<?>> groupExpressions = resolveGroupExpressions(groupBy, pathMap);
        Set<String> activeGroups = resolveActiveGroupNames(groupBy);

        JPAQuery<ActivityResponse> query = queryFactory
                .select(createProjection(activity, dateDayPath, activeGroups))
                .from(activity);

        applyGrouping(query, activity, dateDayPath, groupExpressions);
        applySorting(query, activity, pageable.getSort(), pathMap, groupExpressions);

        long total = calculateTotal(queryFactory, activity, groupExpressions);
        List<ActivityResponse> content = query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(content, pageable, total);
    }
}