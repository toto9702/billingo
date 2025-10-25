package com.student.billingo.controller;

import com.student.billingo.dto.PartnerRequest;
import com.student.billingo.service.PartnerService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/partner")
public class PartnerController {

    private static final Logger logger = LoggerFactory.getLogger(PartnerController.class);

    @Autowired
    private PartnerService partnerService;

    @PostMapping("/save")
    public ResponseEntity save(@Valid @RequestBody PartnerRequest partner) {
        logger.info("Új partner mentése: {}", partner.getEmail());
        partnerService.savePartner(partner);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/update/{currentEmail}")
    public ResponseEntity<String> update(@PathVariable String currentEmail, @Valid @RequestBody PartnerRequest partner) {

        logger.info("Partner frissítése: {} -> {}", currentEmail, partner.getEmail());
        partnerService.updatePartner(currentEmail, partner);
        return ResponseEntity.ok("Partner sikeresen frissítve!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<PartnerRequest>> getAllPartners() {
        logger.info("Összes partner lekérése");
        List<PartnerRequest> partners = partnerService.getAllPartners();
        return ResponseEntity.ok(partners);
    }

    @GetMapping("/emails")
    public ResponseEntity<List<String>> getAllPartnerEmails() {
        logger.info("Összes partner email lekérése");
        List<String> emails = partnerService.getAllPartnerEmails();
        return ResponseEntity.ok(emails);
    }
}
