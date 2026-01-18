package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.dto.ActivityResponse;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityRepository repository;

    @InjectMocks
    private ActivityService activityService;

    @Test
    void getAggregatedActivities_shouldCallRepository() {
        // Arrange
        List<String> groupBy = List.of("project", "employee");
        Pageable pageable = PageRequest.of(0, 10);
        Page<ActivityResponse> expectedPage = new PageImpl<>(List.of());
        
        when(repository.findAggregatedDynamic(eq(groupBy), eq(pageable))).thenReturn(expectedPage);

        // Act
        Page<ActivityResponse> result = activityService.getAggregatedActivities(groupBy, pageable);

        // Assert
        assertEquals(expectedPage, result);
        verify(repository, times(1)).findAggregatedDynamic(groupBy, pageable);
    }
}
