package com.bwromero.activity.aggregation.api.controller;

import com.bwromero.activity.aggregation.api.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.bwromero.activity.aggregation.api.model.ActivityResponse;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ActivityController {

    private final ActivityService service;

    @GetMapping("/aggregate")
    public List<ActivityResponse> getAggregated(@RequestParam(required = false) List<String> groupBy) {
        return service.getAggregatedActivities(groupBy);
    }
}
