package com.mednex.backend.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BloodGroupConverter implements AttributeConverter<BloodGroup, String> {

    @Override
    public String convertToDatabaseColumn(BloodGroup attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public BloodGroup convertToEntityAttribute(String dbData) {
        return dbData == null ? null : BloodGroup.fromDbValue(dbData);
    }
}
