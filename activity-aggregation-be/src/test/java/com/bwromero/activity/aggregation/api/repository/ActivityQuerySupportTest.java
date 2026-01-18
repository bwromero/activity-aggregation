package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.QActivity;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.dsl.Expressions;
import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ActivityQuerySupportTest {

    private final QActivity activity = QActivity.activity;
    private final Expression<Date> dateDayPath = Expressions.dateTimeTemplate(Date.class, "CAST({0} AS date)", activity.date);

    @Test
    void createPathMap_shouldContainExpectedPaths() {
        Map<String, Expression<?>> pathMap = ActivityQuerySupport.createPathMap(activity, dateDayPath);
        
        assertEquals(3, pathMap.size());
        assertTrue(pathMap.containsKey("project"));
        assertTrue(pathMap.containsKey("employee"));
        assertTrue(pathMap.containsKey("date"));
    }

    @Test
    void resolveGroupExpressions_shouldReturnMappedExpressions() {
        Map<String, Expression<?>> pathMap = ActivityQuerySupport.createPathMap(activity, dateDayPath);
        List<String> groupBy = List.of("PROJECT", "unknown", "date");
        
        List<Expression<?>> result = ActivityQuerySupport.resolveGroupExpressions(groupBy, pathMap);
        
        assertEquals(2, result.size());
        assertTrue(result.contains(pathMap.get("project")));
        assertTrue(result.contains(pathMap.get("date")));
    }

    @Test
    void resolveActiveGroupNames_shouldReturnSetOfLoweredNames() {
        List<String> groupBy = List.of("Project", "Employee");
        
        Set<String> result = ActivityQuerySupport.resolveActiveGroupNames(groupBy);
        
        assertEquals(2, result.size());
        assertTrue(result.contains("project"));
        assertTrue(result.contains("employee"));
    }
}
