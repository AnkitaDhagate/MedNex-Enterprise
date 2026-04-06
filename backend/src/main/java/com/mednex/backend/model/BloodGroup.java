package com.mednex.backend.model;

public enum BloodGroup {
    A_POSITIVE("A+"), A_NEGATIVE("A-"),
    B_POSITIVE("B+"), B_NEGATIVE("B-"),
    AB_POSITIVE("AB+"), AB_NEGATIVE("AB-"),
    O_POSITIVE("O+"), O_NEGATIVE("O-");

    private final String dbValue;

    BloodGroup(String dbValue) { this.dbValue = dbValue; }

    public String getDbValue() { return dbValue; }

    public static BloodGroup fromDbValue(String v) {
        if (v == null) return null;
        for (BloodGroup bg : values()) {
            if (bg.dbValue.equalsIgnoreCase(v)) return bg;
        }
        return null; // graceful fallback
    }
}
