package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.dto.ActivityResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

@SpringBootTest
@Transactional // Automatically rolls back any DB changes made during tests
class ActivityAggregationIntegrationTest {

    @Autowired
    private ActivityService activityService;

    @ParameterizedTest(name = "[{index}] Grouping by: {1}")
    @MethodSource("provideGroupingCombinations")
    @DisplayName("Verify aggregation logic for all UI checkbox combinations")
    void shouldAggregateCorrectly(List<String> groupBy, String description) {
        // Arrange
        var pageRequest = PageRequest.of(0, 25);
        Set<String> groupedFields = Set.copyOf(groupBy);

        // Act
        Page<ActivityResponse> result = activityService.getAggregatedActivities(groupBy, pageRequest);

        // Assert
        assertThat(result.getContent())
                .as("Aggregation for %s should return content", description)
                .isNotEmpty()
                .allSatisfy(row -> {
                    // Modern Assertion: Verify "Grouping" vs "Typed Nulls"
                    verifyField(row.project(), "project", groupedFields);
                    verifyField(row.employee(), "employee", groupedFields);
                    verifyField(row.date(), "date", groupedFields);

                    // Business Rule: Hours must always be a positive aggregate
                    assertThat(row.hours()).isPositive();
                });
    }

    private void verifyField(Object value, String fieldName, Set<String> groupedFields) {
        if (groupedFields.isEmpty()) {
            // Flattened View Rule: All fields should be present
            assertThat(value).as("%s should be present in flattened view", fieldName).isNotNull();
        } else if (groupedFields.contains(fieldName)) {
            // Grouped Rule: Field must be present
            assertThat(value).as("%s should be present when grouped", fieldName).isNotNull();
        } else {
            // "Typed Null" Rule: Field MUST be null if not part of the group
            assertThat(value).as("%s should be null when not grouped", fieldName).isNull();
        }
    }

    static Stream<Arguments> provideGroupingCombinations() {
        return Stream.of(
                arguments(List.of(), "Flattened View (Empty)"),
                arguments(List.of("project"), "Project Only"),
                arguments(List.of("employee"), "Employee Only"),
                arguments(List.of("date"), "Date Only"),
                arguments(List.of("project", "employee"), "Project + Employee"),
                arguments(List.of("project", "date"), "Project + Date"),
                arguments(List.of("employee", "date"), "Employee + Date"),
                arguments(List.of("project", "employee", "date"), "Full Aggregation")
        );
    }
}