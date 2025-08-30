# API Endpoint Translation Audit Report

Generated on: 2025-08-30T10:48:26.930Z

## Summary

- **Total Frontend API Files**: 44
- **Total API Endpoints Discovered**: 302
- **Translation Support**: 78.81%

## Endpoints by Category

- **customer**: 21 endpoints
- **user**: 9 endpoints
- **settings**: 47 endpoints
- **communication**: 25 endpoints
- **accounting**: 65 endpoints
- **other**: 82 endpoints
- **auth**: 4 endpoints
- **invoice**: 26 endpoints
- **reports**: 16 endpoints
- **inventory**: 7 endpoints

## Endpoints by HTTP Method

- **GET**: 177 endpoints
- **POST**: 75 endpoints
- **DELETE**: 16 endpoints
- **PUT**: 33 endpoints
- **PATCH**: 1 endpoints

## Critical Endpoints Needing Translation Support

1. **GET ],
    queryFn: settingsApi.getCompanySettings,
  });
};

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: CompanySettingsUpdate) => settingsApi.updateCompanySettings(settings),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [** (customer)
   - Translation support: No
   - Error handling: Yes

2. **GET ],
    queryFn: settingsApi.getGoldPriceConfig,
  });
};

export const useUpdateGoldPrice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (priceUpdate: GoldPriceUpdate) => settingsApi.updateGoldPrice(priceUpdate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [** (customer)
   - Translation support: No
   - Error handling: Yes

3. **GET ],
    queryFn: settingsApi.getInvoiceTemplate,
  });
};

export const useUpdateInvoiceTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (templateUpdate: InvoiceTemplateUpdate) => settingsApi.updateInvoiceTemplate(templateUpdate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [** (customer)
   - Translation support: No
   - Error handling: Yes

4. **GET ],
    queryFn: settingsApi.getAllRoles,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roleData: RoleCreate) => settingsApi.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [** (customer)
   - Translation support: No
   - Error handling: Yes

5. **GET ],
    queryFn: settingsApi.getPermissionStructure,
  });
};

// User Management Hooks
export const useUsers = (page: number = 1, perPage: number = 50) => {
  return useQuery({
    queryKey: [** (user)
   - Translation support: No
   - Error handling: Yes

6. **GET system-settings** (settings)
   - Translation support: No
   - Error handling: Yes

7. **GET , params],
    queryFn: () => smsApi.templates.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSMSTemplate = (id: string) => {
  return useQuery({
    queryKey: [** (communication)
   - Translation support: No
   - Error handling: Yes

8. **GET , params],
    () => smsApi.campaigns.getCampaigns(params),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes - increased cache time
      cacheTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: false,
    }
  );
};

export const useSMSCampaign = (id: string) => {
  return useQuery({
    queryKey: [** (communication)
   - Translation support: No
   - Error handling: Yes

9. **GET , id],
    queryFn: () => smsApi.campaigns.getCampaignStats(id),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// SMS Batch Operations Hooks
export const useSendBatchSMS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (batch: SMSBatchRequest) => smsApi.batch.sendBatch(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [** (customer)
   - Translation support: No
   - Error handling: Yes

10. **GET , filters],
    () => smsApi.history.getHistory(filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - increased cache time
      cacheTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: false,
    }
  );
};

export const useSMSOverallStats = () => {
  return useQuery(
    [** (communication)
   - Translation support: No
   - Error handling: Yes

## Detailed Endpoint Analysis

### GET ],
    queryFn: systemAdminApi.getSSLCertificateStatus,
    refetchInterval: 3600000, // Refresh every hour
    staleTime: 1800000, // 30 minutes
  });
};

export const useSSLCertificateRenewal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.renewSSLCertificate,
    onSuccess: (data) => {
      toast.success( (customer)

- **File**: hooks/useSystemAdmin.ts
- **Translation Support**: Yes
- **Error Handling**: Yes

### GET ],
    queryFn: systemAdminApi.getSecurityStatus,
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000, // 2 minutes
  });
};

export const useSecurityScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.runSecurityScan,
    onSuccess: (data) => {
      toast.success( (customer)

- **File**: hooks/useSystemAdmin.ts
- **Translation Support**: Yes
- **Error Handling**: Yes

### GET ],
    queryFn: settingsApi.getCompanySettings,
  });
};

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: CompanySettingsUpdate) => settingsApi.updateCompanySettings(settings),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ (customer)

- **File**: hooks/useSettings.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET ],
    queryFn: settingsApi.getGoldPriceConfig,
  });
};

export const useUpdateGoldPrice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (priceUpdate: GoldPriceUpdate) => settingsApi.updateGoldPrice(priceUpdate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ (customer)

- **File**: hooks/useSettings.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET ],
    queryFn: settingsApi.getInvoiceTemplate,
  });
};

export const useUpdateInvoiceTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (templateUpdate: InvoiceTemplateUpdate) => settingsApi.updateInvoiceTemplate(templateUpdate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ (customer)

- **File**: hooks/useSettings.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET ],
    queryFn: settingsApi.getAllRoles,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roleData: RoleCreate) => settingsApi.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ (customer)

- **File**: hooks/useSettings.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET ],
    queryFn: settingsApi.getPermissionStructure,
  });
};

// User Management Hooks
export const useUsers = (page: number = 1, perPage: number = 50) => {
  return useQuery({
    queryKey: [ (user)

- **File**: hooks/useSettings.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET system-settings (settings)

- **File**: hooks/useSettings.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET , params],
    queryFn: () => smsApi.templates.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSMSTemplate = (id: string) => {
  return useQuery({
    queryKey: [ (communication)

- **File**: hooks/useSMS.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET , params],
    () => smsApi.campaigns.getCampaigns(params),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes - increased cache time
      cacheTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: false,
    }
  );
};

export const useSMSCampaign = (id: string) => {
  return useQuery({
    queryKey: [ (communication)

- **File**: hooks/useSMS.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET , id],
    queryFn: () => smsApi.campaigns.getCampaignStats(id),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// SMS Batch Operations Hooks
export const useSendBatchSMS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (batch: SMSBatchRequest) => smsApi.batch.sendBatch(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ (customer)

- **File**: hooks/useSMS.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET , filters],
    () => smsApi.history.getHistory(filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - increased cache time
      cacheTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: false,
    }
  );
};

export const useSMSOverallStats = () => {
  return useQuery(
    [ (communication)

- **File**: hooks/useSMS.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET , params],
    queryFn: () => smsApi.history.getMessages(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSMSMessage = (id: string) => {
  return useQuery({
    queryKey: [ (communication)

- **File**: hooks/useSMS.ts
- **Translation Support**: No
- **Error Handling**: Yes

**Recommendations**:
- [HIGH] Add language header support to API calls

### GET , includeInactive],
      queryFn: () => enhancedAccountingApi.getChartOfAccounts(includeInactive),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const useChartOfAccount = (accountId: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

### GET , filters],
      queryFn: () => enhancedAccountingApi.getSubsidiaryAccounts(filters),
      staleTime: 10 * 60 * 1000,
    });
  };

  const useSubsidiaryAccount = (subsidiaryId: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

### GET , filters],
      queryFn: () => enhancedAccountingApi.getJournalEntries(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const useJournalEntry = (entryId: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

### GET , accountId, filters],
      queryFn: () => enhancedAccountingApi.getGeneralLedger(accountId, filters),
      enabled: !!accountId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useAccountBalance = (accountId: string, asOfDate?: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

### GET , filters],
      queryFn: () => enhancedAccountingApi.getChecks(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCheck = (checkId: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

### GET , filters],
      queryFn: () => enhancedAccountingApi.getInstallmentAccounts(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useInstallmentAccount = (installmentId: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

### GET , installmentId],
      queryFn: () => enhancedAccountingApi.getInstallmentPayments(installmentId),
      enabled: !!installmentId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Bank Reconciliation
  const useBankReconciliations = (bankAccountId?: string) => {
    return useQuery({
      queryKey: [ (accounting)

- **File**: hooks/useEnhancedAccounting.ts
- **Translation Support**: No
- **Error Handling**: No

**Recommendations**:
- [HIGH] Add language header support to API calls
- [MEDIUM] Implement proper error handling with translation support

## Frontend API Usage Analysis

### hooks/useSystemAdmin.ts

- **API Calls**: 2
- **Error Handlers**: 16
- **Translation Usage**: 1

**Recommendations**:
- [HIGH] 16 error handlers need translation support

### hooks/useSettings.ts

- **API Calls**: 6
- **Error Handlers**: 11
- **Translation Usage**: 0

**Recommendations**:
- [MEDIUM] Consider adding language headers to API calls

### hooks/useSMS.ts

- **API Calls**: 5
- **Error Handlers**: 9
- **Translation Usage**: 0

**Recommendations**:
- [MEDIUM] Consider adding language headers to API calls

### hooks/useInventoryIntelligence.ts

- **API Calls**: 0
- **Error Handlers**: 5
- **Translation Usage**: 0

**Recommendations**:
- [HIGH] 5 error handlers need translation support

### hooks/useEnhancedAccounting.ts

- **API Calls**: 10
- **Error Handlers**: 0
- **Translation Usage**: 0

**Recommendations**:
- [MEDIUM] Consider adding language headers to API calls

### hooks/useCategoryManagement.ts

- **API Calls**: 8
- **Error Handlers**: 1
- **Translation Usage**: 0

**Recommendations**:
- [HIGH] 1 error handlers need translation support
- [MEDIUM] Consider adding language headers to API calls

### hooks/useBusinessAdaptability.ts

- **API Calls**: 5
- **Error Handlers**: 0
- **Translation Usage**: 0

**Recommendations**:
- [MEDIUM] Consider adding language headers to API calls

### hooks/useAuth.ts

- **API Calls**: 4
- **Error Handlers**: 2
- **Translation Usage**: 2

**Recommendations**:
- [HIGH] 2 error handlers need translation support

### hooks/useAnalytics.ts

- **API Calls**: 0
- **Error Handlers**: 6
- **Translation Usage**: 0

**Recommendations**:
- [HIGH] 6 error handlers need translation support

### hooks/useAdvancedSearch.ts

- **API Calls**: 13
- **Error Handlers**: 0
- **Translation Usage**: 0

**Recommendations**:
- [MEDIUM] Consider adding language headers to API calls

## Implementation Recommendations

### Backend Translation Support

1. **Add Language Header Middleware**: Implement middleware to extract and validate Accept-Language headers
2. **Create Translation Service**: Build a service to handle message translation based on user language
3. **Update Error Responses**: Modify error handling to return translated messages
4. **Validation Message Translation**: Implement translated validation messages

### Frontend API Integration

1. **Language Headers**: Add Accept-Language headers to all API requests
2. **Error Message Translation**: Ensure error responses are properly translated in UI
3. **Consistent Error Handling**: Standardize error handling across all API calls

### Priority Implementation Order

1. **High Priority**: Authentication and user-facing error messages
2. **Medium Priority**: Validation messages and status updates
3. **Low Priority**: Debug messages and internal status codes

---

*This report was generated automatically by the API Endpoint Translation Audit tool.*
