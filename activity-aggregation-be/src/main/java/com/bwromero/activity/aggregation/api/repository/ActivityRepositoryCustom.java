package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.dto.ActivityResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ActivityRepositoryCustom {
    Page<ActivityResponse> findAggregatedDynamic(List<String> groupBy, Pageable pageable);
}