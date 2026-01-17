package com.bwromero.activity.aggregation.api.model;

import java.sql.Date;

/**
 * DTO for aggregated activity data.
 * The field types must match the types projected in ActivityRepositoryImpl.
 */
public record ActivityResponse(
        String project,
        String employee,
        Date date,
        Integer hours
) {}