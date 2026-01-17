package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.ActivityResponse;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;

    @Cacheable(value = "activities", key = "T(java.util.Objects).hash(#groupBy, #pageable.pageNumber, #pageable.pageSize, #pageable.sort.toString())")
    public Page<ActivityResponse> getAggregatedActivities(List<String> groupBy, Pageable pageable) {
        return repository.findAggregatedDynamic(groupBy, pageable);
    }
}
