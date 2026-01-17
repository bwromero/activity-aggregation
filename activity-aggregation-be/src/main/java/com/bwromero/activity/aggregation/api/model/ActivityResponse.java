package com.bwromero.activity.aggregation.api.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.ZonedDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActivityResponse(
    String project,
    String employee,
    ZonedDateTime date,
    Integer hours
) {}
