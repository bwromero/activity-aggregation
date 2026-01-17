package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import com.bwromero.activity.aggregation.api.model.ActivityResponse;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;

    @Cacheable(value = "activities", key = "#groupBy == null || #groupBy.isEmpty() ? '__all__' : T(java.util.stream.Stream).of(#groupBy.toArray()).sorted().collect(T(java.util.stream.Collectors).joining(','))")
    public List<ActivityResponse> getAggregatedActivities(List<String> groupBy) {
        List<Activity> allActivities = repository.findAll();

        if (groupBy == null || groupBy.isEmpty()) {
            return allActivities.stream().map(a -> new ActivityResponse(
                    a.getProject().getName(),
                    a.getEmployee().getName(),
                    a.getDate().toLocalDate().toString(),
                    a.getHours()
            )).collect(Collectors.toList());
        }

        Map<List<Object>, Integer> aggregated = new LinkedHashMap<>();

        for (Activity a : allActivities) {
            List<Object> key = new ArrayList<>();
            for (String field : groupBy) {
                switch (field.toLowerCase()) {
                    case "project" -> key.add(a.getProject().getName());
                    case "employee" -> key.add(a.getEmployee().getName());
                    case "date" -> key.add(a.getDate().toLocalDate().toString());
                }
            }
            aggregated.merge(key, a.getHours(), Integer::sum);
        }

        return mapToActivityResponseList(aggregated, groupBy);
    }

        private List<ActivityResponse> mapToActivityResponseList(Map<List<Object>, Integer> aggregated, List<String> groupBy) {
            List<ActivityResponse> result = new ArrayList<>();
            for (Map.Entry<List<Object>, Integer> entry : aggregated.entrySet()) {
                String project = null;
                String employee = null;
                String date = null;

                List<Object> values = entry.getKey();
                for (int i = 0; i < groupBy.size(); i++) {
                    String field = groupBy.get(i).toLowerCase();
                    Object value = values.get(i);

                    switch (field) {
                        case "project" -> project = (String) value;
                        case "employee" -> employee = (String) value;
                        case "date" -> date = (String) value;
                    }
                }

                result.add(new ActivityResponse(project, employee, date, entry.getValue()));
            }
            return result;
        }
    }
