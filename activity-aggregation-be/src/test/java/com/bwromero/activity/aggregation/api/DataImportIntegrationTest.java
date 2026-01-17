package com.bwromero.activity.aggregation.api;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DataImportIntegrationTest {

    @Autowired
    private ActivityRepository activityRepository;

    @Test
    void shouldLoadActivitiesFromCsv() {
        List<Activity> activities = activityRepository.findAll();
        assertThat(activities).hasSize(6);
        assertThat(activities).anyMatch(a -> a.getProject().getName().equals("Mars Rover"));
        assertThat(activities).anyMatch(a -> a.getEmployee().getName().equals("Mario"));
    }
}
