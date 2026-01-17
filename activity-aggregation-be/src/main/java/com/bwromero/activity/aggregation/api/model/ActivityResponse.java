package com.bwromero.activity.aggregation.api.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActivityResponse(
    String project,
    String employee,
    String date,
    Integer hours
) {}
