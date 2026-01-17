package com.bwromero.activity.aggregation.api.controller;

import com.bwromero.activity.aggregation.api.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.bwromero.activity.aggregation.api.model.ActivityResponse;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService service;

    @GetMapping("/aggregate")
    public Page<ActivityResponse> getAggregated(
            @RequestParam(required = false) List<String> groupBy,
            Pageable pageable) {
        return service.getAggregatedActivities(groupBy, pageable);
    }
}
