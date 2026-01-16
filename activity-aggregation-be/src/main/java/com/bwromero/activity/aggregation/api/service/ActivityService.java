package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;

    /**
     * Aggregates activities based on a list of fields.
     * The order of the fields in groupBy determines the aggregation hierarchy and display order.
     */
    public List<Map<String, Object>> getAggregatedActivities(List<String> groupBy) {
        List<Activity> allActivities = repository.findAll();

        // If no grouping is requested, return the raw list with all fields
        if (groupBy == null || groupBy.isEmpty()) {
            return allActivities.stream().map(a -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("Project", a.getProject().getName());
                map.put("Employee", a.getEmployee().getName());
                map.put("Date", a.getDate().toLocalDate().toString());
                map.put("Hours", a.getHours());
                return map;
            }).collect(Collectors.toList());
        }

        // Grouping logic:
        // Use a List of Objects as the key for the Map to represent the combination of grouping fields.
        // LinkedHashMap is used to keep the order of insertion if needed, 
        // though usually sorting happens after or by the grouping key.
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

        // Convert the grouping map into a list of maps for the JSON response
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<List<Object>, Integer> entry : aggregated.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            List<Object> keyValues = entry.getKey();
            for (int i = 0; i < groupBy.size(); i++) {
                String field = groupBy.get(i);
                String displayName = field.substring(0, 1).toUpperCase() + field.substring(1).toLowerCase();
                row.put(displayName, keyValues.get(i));
            }
            row.put("Hours", entry.getValue());
            result.add(row);
        }

        return result;
    }
}
