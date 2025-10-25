package com.student.billingo.exception;

public class PartnerNotFoundException extends RuntimeException {
    public PartnerNotFoundException(String email) {
        super("Nem található partner ezzel az email címmel: " + email);
    }
}
