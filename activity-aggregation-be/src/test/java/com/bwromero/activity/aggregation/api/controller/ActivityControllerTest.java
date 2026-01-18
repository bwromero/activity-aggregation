package com.bwromero.activity.aggregation.api.controller;

import com.bwromero.activity.aggregation.api.dto.ActivityResponse;
import com.bwromero.activity.aggregation.api.service.ActivityService;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityControllerTest {

    @Mock
    private ActivityService service;

    @InjectMocks
    private ActivityController controller;

    @Test
    void getAggregated_shouldCallService() {
        // Arrange
        List<String> groupBy = List.of("project");
        Pageable pageable = PageRequest.of(0, 10);
        Page<ActivityResponse> expectedPage = new PageImpl<>(List.of());
        
        when(service.getAggregatedActivities(groupBy, pageable)).thenReturn(expectedPage);

        // Act
        Page<ActivityResponse> result = controller.getAggregated(groupBy, pageable);

        // Assert
        assertEquals(expectedPage, result);
        verify(service, times(1)).getAggregatedActivities(groupBy, pageable);
    }
}
