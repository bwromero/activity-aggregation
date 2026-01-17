package com.bwromero.activity.aggregation.api;

import com.bwromero.activity.aggregation.api.model.ActivityResponse;
import com.bwromero.activity.aggregation.api.service.ActivityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ActivityAggregationApplicationTests {

    @Autowired
    private ActivityService activityService;

    @Test
    void contextLoads() {
    }

    @Test
    void shouldAggregateByProject() {
        Page<ActivityResponse> result = activityService.getAggregatedActivities(List.of("project"), PageRequest.of(0, 10));
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().get(0).project()).isNotNull();
        assertThat(result.getContent().get(0).employee()).isNull();
        assertThat(result.getContent().get(0).date()).isNull();
        assertThat(result.getContent().get(0).hours()).isPositive();
    }

    @Test
    void shouldAggregateByProjectAndEmployee() {
        Page<ActivityResponse> result = activityService.getAggregatedActivities(List.of("project", "employee"), PageRequest.of(0, 10));
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().get(0).project()).isNotNull();
        assertThat(result.getContent().get(0).employee()).isNotNull();
        assertThat(result.getContent().get(0).date()).isNull();
        assertThat(result.getContent().get(0).hours()).isPositive();
    }
}
