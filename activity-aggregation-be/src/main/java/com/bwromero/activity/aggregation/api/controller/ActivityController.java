package com.bwromero.activity.aggregation.api.controller;

import com.bwromero.activity.aggregation.api.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Enable CORS for Angular dev server
public class ActivityController {

    private final ActivityService service;

    /**
     * Endpoint to get aggregated activities.
     * Example usage: GET /api/activities/aggregate?groupBy=employee,project
     */
    @GetMapping("/aggregate")
    public List<Map<String, Object>> getAggregated(@RequestParam(required = false) List<String> groupBy) {
        return service.getAggregatedActivities(groupBy);
    }
}
