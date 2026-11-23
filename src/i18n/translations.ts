import { Language, PaymentMode, UnitType } from '../types/pos';

export interface TranslationStrings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  backupSafe: string;
  homeBtn: string;
  backBtn: string;
  closeBtn: string;
  cancelBtn: string;
  saveBtn: string;
  deleteBtn: string;
  editBtn: string;

  // Home cards
  homeSubtitle: string;
  cardNewBillTitle: string;
  cardNewBillDesc: string;
  cardKhataTitle: string;
  cardKhataDesc: string;
  cardStockTitle: string;
  cardStockDesc: string;
  cardHisabTitle: string;
  cardHisabDesc: string;
  pendingTotalLabel: string;
  lowStockCountLabel: string;
  allStockOkLabel: string;
  todaySaleSmallLabel: string;
  shortcutHint: string;

  // Billing Screen
  billingTitle: string;
  customerNameInputLabel: string;
  customerNameInputPlaceholder: string;
  defaultCashCustomerMr: string;
  defaultCashCustomerEn: string;
  scanOrSearchPlaceholder: string;
  allProductsCatalogTitle: string;
  noMatchingItem: string;
  currentBillTitle: string;
  emptyBillMessage: string;
  emptyBillSubMessage: string;
  clearBillBtn: string;
  itemsCountLabel: string;
  totalAmountLabel: string;
  payCashBtn: string;
  payUpiBtn: string;
  payKhataBtn: string;
  colBillItem: string;
  colBillQty: string;
  colBillRate: string;
  colBillTotal: string;
  hotkeyBarHint: string;
  hotkeyQtyLabel: string;
  hotkeyRateLabel: string;
  hotkeyTempTotalLabel: string;
  qtyModalTitle: string;
  qtyModalHelperKg: string;
  qtyModalHelperPiece: string;
  qtyModalHelperKatta: string;
  qtyInputLabelKg: string;
  qtyInputLabelPiece: string;
  qtyInputLabelKatta: string;
  addToBillBtn: string;
  selectKhataCustomerTitle: string;
  searchCustomerPlaceholder: string;
  orAddNewCustomer: string;
  confirmUdhaarBillBtn: string;
  cashUpiCustomerModalTitleCash: string;
  cashUpiCustomerModalTitleUpi: string;
  enterCustomerNameRequiredLabel: string;
  enterCustomerNameRequiredPlaceholder: string;
  customerMobileOptionalLabel: string;
  saveBillWithCustomerBtn: string;
  saveAsWalkInCashBtn: string;
  matchingCustomersLabel: string;
  billSavedToast: string;
  barcodeNotFoundToast: string;

  // Receipt Modal
  receiptTitle: string;
  receiptBillNo: string;
  receiptDate: string;
  receiptMode: string;
  receiptCustomer: string;
  receiptItemCol: string;
  receiptQtyCol: string;
  receiptAmtCol: string;
  receiptTotal: string;
  receiptThankYou: string;
  printReceiptBtn: string;
  newBillAfterPrintBtn: string;
  modeCash: string;
  modeUpi: string;
  modeKhata: string;

  // Khata Screen
  khataTitle: string;
  addCustomerBtn: string;
  totalPendingAllLabel: string;
  pendingBalancePrefix: string;
  clearedBalanceText: string;
  noCustomersFound: string;
  openPassbookBtn: string;
  addCreditBtn: string;
  receivePaymentBtn: string;
  sendWhatsAppBtn: string;
  sendSelectedBillsWhatsAppBtn: string;
  selectAllBillsLabel: string;
  passbookHistoryTitle: string;
  noTransactionsYet: string;
  entryTypeUdhaar: string;
  entryTypeJama: string;
  entryTypePaidCash: string;
  entryTypePaidUpi: string;
  colSrNo: string;
  colBillNo: string;
  colCustomerName: string;
  colDate: string;
  colType: string;
  colAmount: string;
  colPrint: string;
  printInvoiceBtn: string;
  newCustomerModalTitle: string;
  customerNameMrLabel: string;
  customerNameEnLabel: string;
  customerMobileLabel: string;
  openingBalanceLabel: string;
  addCreditModalTitle: string;
  receivePaymentModalTitle: string;
  enterAmountLabel: string;
  enterNoteLabel: string;
  creditNotePlaceholder: string;
  paymentNotePlaceholder: string;
  paymentMethodLabel: string;
  fullPendingBtn: string;
  confirmCreditBtn: string;
  confirmPaymentBtn: string;
  customerAddedToast: string;
  creditSavedToast: string;
  paymentSavedToast: string;
  defaultCreditNote: string;
  defaultPaymentNote: string;
  billNotePrefix: string;

  // Stock Screen
  stockTitle: string;
  addItemBtn: string;
  searchStockPlaceholder: string;
  filterAll: string;
  filterLowStock: string;
  filterLooseKg: string;
  colItemName: string;
  colBarcode: string;
  colUnit: string;
  colRate: string;
  colStock: string;
  colAction: string;
  lowStockBadge: string;
  unitKg: string;
  unitPiece: string;
  unitKatta: string;
  unitKgShort: string;
  unitPieceShort: string;
  unitKattaShort: string;
  bagWeightLabel: string;
  bagWeightPlaceholder: string;
  addItemModalTitle: string;
  editItemModalTitle: string;
  nameMrLabel: string;
  nameEnLabel: string;
  phoneticLabel: string;
  phoneticPlaceholder: string;
  barcodeLabel: string;
  generateBarcodeBtn: string;
  unitLabel: string;
  rateLabel: string;
  currentStockLabel: string;
  lowStockLimitLabel: string;
  itemSavedToast: string;
  itemDeletedToast: string;
  noStockItemsFound: string;

  // Hisab & Date Filter & Backup Screen
  hisabTitle: string;
  dateFilterToday: string;
  dateFilterYesterday: string;
  dateFilterAll: string;
  dateFilterPickDate: string;
  todayTotalSales: string;
  cashInDrawer: string;
  upiReceived: string;
  newUdhaarGiven: string;
  billsCountSuffix: string;
  fromBillsLabel: string;
  fromKhataJamaLabel: string;
  todaysBillsTitle: string;
  noBillsForDate: string;
  viewReceiptBtn: string;
  backupSectionTitle: string;
  backupSectionDesc: string;
  lastBackupLabel: string;
  neverBackedUp: string;
  downloadBackupBtn: string;
  restoreBackupBtn: string;
  backupDownloadedToast: string;
  restoreConfirmTitle: string;
  restoreConfirmMessage: string;
  restoreConfirmBtn: string;
  restoreSuccessToast: string;
  restoreErrorToast: string;
}

export const translations: Record<Language, TranslationStrings> = {
  mr: {
    shopName: 'जनशांती किराणा स्टोअर',
    shopAddress: 'हिरापूर, चांदवड, नाशिक, महाराष्ट्र',
    shopPhone: '9766518265',
    backupSafe: 'बॅकअप सुरक्षित',
    homeBtn: 'मुख्य पान',
    backBtn: 'मागे जा',
    closeBtn: 'बंद करा',
    cancelBtn: 'रद्द करा',
    saveBtn: 'जतन करा',
    deleteBtn: 'काढून टाका',
    editBtn: 'बदला',

    homeSubtitle: 'काम सुरू करण्यासाठी खालील मोठा पर्याय निवडा',
    cardNewBillTitle: 'नवीन बिल',
    cardNewBillDesc: 'ग्राहकाचे बिल बनवा आणि पावती काढा',
    cardKhataTitle: 'उधार',
    cardKhataDesc: 'ग्राहकाची बाकी पहा, बिले प्रिंट करा आणि पैसे जमा करा',
    cardStockTitle: 'सामान आणि भाव',
    cardStockDesc: 'वस्तूंचे दर बदला आणि शिल्लक स्टॉक पहा',
    cardHisabTitle: 'आजचा हिशोब',
    cardHisabDesc: 'तारीखवार विक्री, गल्ला आणि बॅकअप',
    pendingTotalLabel: 'एकूण उधार बाकी',
    lowStockCountLabel: 'वस्तू कमी स्टॉकमध्ये',
    allStockOkLabel: 'सर्व स्टॉक व्यवस्थित',
    todaySaleSmallLabel: 'आजची विक्री',
    shortcutHint: 'कीबोर्ड शॉर्टकट: F1 ते F4',

    billingTitle: 'नवीन बिल',
    customerNameInputLabel: 'ग्राहकाचे नाव (ऐच्छिक)',
    customerNameInputPlaceholder: 'ग्राहकाचे नाव लिहा (रिकामे = रोख ग्राहक)',
    defaultCashCustomerMr: 'रोख ग्राहक',
    defaultCashCustomerEn: 'Cash Customer',
    scanOrSearchPlaceholder: 'शोधा: साखर, sakhar, sugar, tandul, dal, tel किंवा बारकोड...',
    allProductsCatalogTitle: 'सर्व किराणा सामान',
    noMatchingItem: 'असे सामान सापडले नाही',
    currentBillTitle: 'ग्राहकाचे बिल',
    emptyBillMessage: 'बिलात अजून सामान नाही',
    emptyBillSubMessage: 'डावीकडून सामान निवडा किंवा नाव/बारकोड टाईप करा',
    clearBillBtn: 'बिल पुसा',
    itemsCountLabel: 'वस्तू',
    totalAmountLabel: 'एकूण रक्कम',
    payCashBtn: 'रोख (CASH)',
    payUpiBtn: 'फोनपे / UPI',
    payKhataBtn: 'उधार',
    colBillItem: 'वस्तू',
    colBillQty: 'नग/वजन',
    colBillRate: 'दर',
    colBillTotal: 'एकूण',
    hotkeyBarHint: 'ओळ निवडा आणि दाबा:',
    hotkeyQtyLabel: '[Q] वजन/नग',
    hotkeyRateLabel: '[R] दर बदला',
    hotkeyTempTotalLabel: '[T] तात्पुरती रक्कम',
    qtyModalTitle: 'वजन / नग लिहा',
    qtyModalHelperKg: '1 = 1 किलो · 0.5 = 500 ग्रॅम · 0.25 = 250 ग्रॅम · 0.1 = 100 ग्रॅम',
    qtyModalHelperPiece: 'नग संख्या लिहा (उदा. 1, 2, 5)',
    qtyModalHelperKatta: 'कट्ट्यांची संख्या लिहा (उदा. 1 = 1 कट्टा, 0.5 = अर्धा कट्टा)',
    qtyInputLabelKg: 'वजन किलोमध्ये लिहा (Enter दाबा)',
    qtyInputLabelPiece: 'नग संख्या लिहा (Enter दाबा)',
    qtyInputLabelKatta: 'कट्टे संख्या लिहा (Enter दाबा)',
    addToBillBtn: 'बिलात टाका (Enter)',
    selectKhataCustomerTitle: 'कोणत्या ग्राहकाच्या उधार खात्यात लिहायचे?',
    searchCustomerPlaceholder: 'ग्राहकाचे नाव किंवा मोबाईल नंबर शोधा...',
    orAddNewCustomer: '+ नवीन ग्राहक जोडा',
    confirmUdhaarBillBtn: 'उधार बिल पक्के करा',
    cashUpiCustomerModalTitleCash: 'रोख बिल — ग्राहकाचे नाव लिहा',
    cashUpiCustomerModalTitleUpi: 'UPI बिल — ग्राहकाचे नाव लिहा',
    enterCustomerNameRequiredLabel: 'ग्राहकाचे नाव लिहा (जतन करण्यापूर्वी)',
    enterCustomerNameRequiredPlaceholder: 'उदा. रमेश पाटील, Suresh...',
    customerMobileOptionalLabel: 'मोबाईल नंबर (ऐच्छिक)',
    saveBillWithCustomerBtn: 'बिल जतन करा (Enter)',
    saveAsWalkInCashBtn: 'नाव न टाकता "रोख ग्राहक" जतन करा',
    matchingCustomersLabel: 'जुने ग्राहक निवडा (1 क्लिकमध्ये जतन करा):',
    billSavedToast: 'बिल जतन झाले!',
    barcodeNotFoundToast: 'हे सामान सापडले नाही',

    receiptTitle: 'पावती प्रिव्ह्यू (80mm)',
    receiptBillNo: 'बिल क्र.',
    receiptDate: 'तारीख',
    receiptMode: 'प्रकार',
    receiptCustomer: 'ग्राहक',
    receiptItemCol: 'वस्तू',
    receiptQtyCol: 'नग/वजन',
    receiptAmtCol: 'रक्कम',
    receiptTotal: 'एकूण रक्कम',
    receiptThankYou: 'धन्यवाद! पुन्हा भेट द्या!',
    printReceiptBtn: 'पावती प्रिंट करा',
    newBillAfterPrintBtn: 'नवीन बिल सुरू करा',
    modeCash: 'रोख',
    modeUpi: 'फोनपे / UPI',
    modeKhata: 'उधार',

    khataTitle: 'उधार',
    addCustomerBtn: '+ नवीन ग्राहक',
    totalPendingAllLabel: 'एकूण येणे बाकी',
    pendingBalancePrefix: 'बाकी आहे:',
    clearedBalanceText: 'बाकी नाही: ₹0',
    noCustomersFound: 'कोणताही ग्राहक सापडला नाही',
    openPassbookBtn: 'खाते पहा',
    addCreditBtn: '+ उधार लिहा',
    receivePaymentBtn: '- पैसे जमा करा',
    sendWhatsAppBtn: 'बाकी WhatsApp वर पाठवा',
    sendSelectedBillsWhatsAppBtn: 'निवडलेली बिले WhatsApp वर पाठवा',
    selectAllBillsLabel: 'सर्व निवडा',
    passbookHistoryTitle: 'खात्याची बिले व व्यवहार',
    noTransactionsYet: 'या तारखेला कोणताही व्यवहार नाही',
    entryTypeUdhaar: 'उधार',
    entryTypeJama: 'जमा',
    entryTypePaidCash: 'रोख बिल',
    entryTypePaidUpi: 'UPI बिल',
    colSrNo: 'अ.क्र.',
    colBillNo: 'बिल नं.',
    colCustomerName: 'ग्राहकाचे नाव',
    colDate: 'तारीख',
    colType: 'प्रकार',
    colAmount: 'रक्कम',
    colPrint: 'प्रिंट',
    printInvoiceBtn: 'प्रिंट',
    newCustomerModalTitle: 'नवीन ग्राहक जोडा',
    customerNameMrLabel: 'ग्राहकाचे नाव (मराठीत)',
    customerNameEnLabel: 'ग्राहकाचे नाव (English मध्ये)',
    customerMobileLabel: 'मोबाईल नंबर (10 अंकी)',
    openingBalanceLabel: 'आधीची बाकी रक्कम असल्यास (₹)',
    addCreditModalTitle: 'नवीन उधार लिहा',
    receivePaymentModalTitle: 'पैसे जमा करा',
    enterAmountLabel: 'रक्कम लिहा (₹)',
    enterNoteLabel: 'तपशील / नोंद (ऐच्छिक)',
    creditNotePlaceholder: 'उदा. घरगुती किराणा सामान',
    paymentNotePlaceholder: 'उदा. रोख पैसे मिळाले',
    paymentMethodLabel: 'पैसे कसे मिळाले?',
    fullPendingBtn: 'संपूर्ण बाकी भरा',
    confirmCreditBtn: 'उधार जतन करा',
    confirmPaymentBtn: 'पैसे जमा करा',
    customerAddedToast: 'नवीन ग्राहक जोडला गेला!',
    creditSavedToast: 'उधार रक्कम लिहिली गेली!',
    paymentSavedToast: 'पैसे जमा झाले!',
    defaultCreditNote: 'किराणा सामान उधार',
    defaultPaymentNote: 'उधार पैसे जमा',
    billNotePrefix: 'बिल क्र.',

    stockTitle: 'सामान आणि भाव',
    addItemBtn: '+ नवीन वस्तू',
    searchStockPlaceholder: 'सामानाचे नाव (साखर, sakhar, sugar) किंवा बारकोड शोधा...',
    filterAll: 'सर्व सामान',
    filterLowStock: 'कमी स्टॉक',
    filterLooseKg: 'सुट्टे (किलो)',
    colItemName: 'सामानाचे नाव',
    colBarcode: 'बारकोड',
    colUnit: 'माप',
    colRate: 'विक्री भाव',
    colStock: 'शिल्लक स्टॉक',
    colAction: 'बदल',
    lowStockBadge: 'कमी स्टॉक',
    unitKg: 'किलो (Kg)',
    unitPiece: 'नग (Piece)',
    unitKatta: 'कट्टा (30kg / 50kg)',
    unitKgShort: 'किलो',
    unitPieceShort: 'नग',
    unitKattaShort: 'कट्टा',
    bagWeightLabel: 'कट्ट्याचे वजन (किलो)',
    bagWeightPlaceholder: 'उदा. 30 किंवा 50',
    addItemModalTitle: 'नवीन वस्तू जोडा',
    editItemModalTitle: 'सामान आणि भाव बदला',
    nameMrLabel: 'मराठी नाव',
    nameEnLabel: 'इंग्रजी नाव (English Name)',
    phoneticLabel: 'शोधण्याचे सोपे शब्द (उदा. sakhar, tandul, dal)',
    phoneticPlaceholder: 'उदा. moog dal mung',
    barcodeLabel: 'बारकोड नंबर',
    generateBarcodeBtn: 'नवीन बनवा',
    unitLabel: 'विक्रीचे माप',
    rateLabel: 'विक्री भाव (₹)',
    currentStockLabel: 'सध्याचा शिल्लक स्टॉक',
    lowStockLimitLabel: 'कमी स्टॉक इशारा मर्यादा',
    itemSavedToast: 'सामान जतन झाले!',
    itemDeletedToast: 'सामान काढून टाकले',
    noStockItemsFound: 'कोणतेही सामान सापडले नाही',

    hisabTitle: 'आजचा हिशोब आणि बॅकअप',
    dateFilterToday: 'आज',
    dateFilterYesterday: 'काल',
    dateFilterAll: 'सर्व दिवस',
    dateFilterPickDate: 'तारीख निवडा:',
    todayTotalSales: 'एकूण विक्री',
    cashInDrawer: 'गल्ल्यातील रोख',
    upiReceived: 'ऑनलाइन जमा (UPI)',
    newUdhaarGiven: 'उधार विक्री',
    billsCountSuffix: 'बिले',
    fromBillsLabel: 'बिल',
    fromKhataJamaLabel: 'उधार जमा',
    todaysBillsTitle: 'बिलांची यादी',
    noBillsForDate: 'या तारखेला एकही बिल बनवलेले नाही',
    viewReceiptBtn: 'प्रिंट',
    backupSectionTitle: 'डेटा बॅकअप आणि सुरक्षा',
    backupSectionDesc: 'तुमचा सर्व हिशोब, उधार खाते आणि सामानाची यादी सुरक्षित ठेवण्यासाठी रोज संध्याकाळी बॅकअप फाईल डाउनलोड करा.',
    lastBackupLabel: 'शेवटचा बॅकअप:',
    neverBackedUp: 'आज डाउनलोड केलेला नाही (ब्राउझरमध्ये सुरक्षित)',
    downloadBackupBtn: 'बॅकअप फाईल डाउनलोड करा',
    restoreBackupBtn: 'बॅकअप परत आणा',
    backupDownloadedToast: 'बॅकअप फाईल यशस्वीरित्या डाउनलोड झाली!',
    restoreConfirmTitle: 'जुन्या बॅकअपमधील डेटा परत आणायचा का?',
    restoreConfirmMessage: 'तुम्ही निवडलेली फाईल अपलोड केल्यावर सध्याचा डेटा बदलून त्या बॅकअपमधील सर्व सामान, ग्राहक आणि बिले परत येतील.',
    restoreConfirmBtn: 'होय, बॅकअप परत आणा',
    restoreSuccessToast: 'बॅकअप यशस्वीरित्या परत आणला गेला!',
    restoreErrorToast: 'ही फाईल योग्य बॅकअप फाईल नाही. कृपया योग्य JSON फाईल निवडा.',
  },
  en: {
    shopName: 'Janshanti Kirana Store',
    shopAddress: 'Hirapur, Chandwad, Nashik, Maharashtra',
    shopPhone: '9766518265',
    backupSafe: 'Backup Safe',
    homeBtn: 'Home',
    backBtn: 'Go Back',
    closeBtn: 'Close',
    cancelBtn: 'Cancel',
    saveBtn: 'Save',
    deleteBtn: 'Delete',
    editBtn: 'Edit',

    homeSubtitle: 'Tap a large card below to start your work',
    cardNewBillTitle: 'New Bill',
    cardNewBillDesc: 'Make customer bill and print receipt',
    cardKhataTitle: 'Udhaar',
    cardKhataDesc: 'Check customer balance, reprint bills & receive payment',
    cardStockTitle: 'Items & Rates',
    cardStockDesc: 'Update item prices and check stock levels',
    cardHisabTitle: "Today's Cash",
    cardHisabDesc: 'Date-wise sales, cash drawer & backup',
    pendingTotalLabel: 'Total Pending',
    lowStockCountLabel: 'items low in stock',
    allStockOkLabel: 'All stock sufficient',
    todaySaleSmallLabel: "Today's Sale",
    shortcutHint: 'Keyboard shortcuts: F1 to F4',

    billingTitle: 'New Bill',
    customerNameInputLabel: 'Customer Name (Optional)',
    customerNameInputPlaceholder: 'Type customer name (blank = Cash Customer)',
    defaultCashCustomerMr: 'रोख ग्राहक',
    defaultCashCustomerEn: 'Cash Customer',
    scanOrSearchPlaceholder: 'Search: sugar, sakhar, साखर, tandul, dal, tel or barcode...',
    allProductsCatalogTitle: 'All Kirana Items',
    noMatchingItem: 'No matching item found',
    currentBillTitle: 'Customer Bill',
    emptyBillMessage: 'No items in bill yet',
    emptyBillSubMessage: 'Select an item on the left or search by name/barcode',
    clearBillBtn: 'Clear Bill',
    itemsCountLabel: 'Items',
    totalAmountLabel: 'Total Amount',
    payCashBtn: 'CASH',
    payUpiBtn: 'PhonePe / UPI',
    payKhataBtn: 'UDHAAR',
    colBillItem: 'Item Name',
    colBillQty: 'Qty',
    colBillRate: 'Rate',
    colBillTotal: 'Total',
    hotkeyBarHint: 'Select row & press:',
    hotkeyQtyLabel: '[Q] Qty',
    hotkeyRateLabel: '[R] Rate',
    hotkeyTempTotalLabel: '[T] Temp Total',
    qtyModalTitle: 'Enter Weight / Quantity',
    qtyModalHelperKg: '1 = 1 kg · 0.5 = 500g · 0.25 = 250g · 0.1 = 100g',
    qtyModalHelperPiece: 'Enter piece count (e.g. 1, 2, 5)',
    qtyModalHelperKatta: 'Enter bag count (e.g. 1 = 1 Bag, 0.5 = Half Bag)',
    qtyInputLabelKg: 'Enter Weight in Kg (Press Enter)',
    qtyInputLabelPiece: 'Enter Quantity (Press Enter)',
    qtyInputLabelKatta: 'Enter Bags / Katta (Press Enter)',
    addToBillBtn: 'Add to Bill (Enter)',
    selectKhataCustomerTitle: 'Select Customer for Udhaar Bill',
    searchCustomerPlaceholder: 'Search customer name or mobile number...',
    orAddNewCustomer: '+ Add New Customer',
    confirmUdhaarBillBtn: 'Confirm Udhaar Bill',
    cashUpiCustomerModalTitleCash: 'Cash Bill — Enter Customer Name',
    cashUpiCustomerModalTitleUpi: 'UPI Bill — Enter Customer Name',
    enterCustomerNameRequiredLabel: 'Customer Name (Before Saving Bill)',
    enterCustomerNameRequiredPlaceholder: 'e.g. Ramesh Patil, Suresh...',
    customerMobileOptionalLabel: 'Mobile Number (Optional)',
    saveBillWithCustomerBtn: 'Save Bill (Enter)',
    saveAsWalkInCashBtn: 'Save as "Cash Customer" (No Name)',
    matchingCustomersLabel: 'Or tap existing customer (1-click save):',
    billSavedToast: 'Bill saved!',
    barcodeNotFoundToast: 'Item not found',

    receiptTitle: 'Receipt Preview (80mm)',
    receiptBillNo: 'Bill No.',
    receiptDate: 'Date',
    receiptMode: 'Type',
    receiptCustomer: 'Customer',
    receiptItemCol: 'Item',
    receiptQtyCol: 'Qty',
    receiptAmtCol: 'Amount',
    receiptTotal: 'Grand Total',
    receiptThankYou: 'Thank you! Please visit again!',
    printReceiptBtn: 'Print Receipt',
    newBillAfterPrintBtn: 'Start New Bill',
    modeCash: 'Cash',
    modeUpi: 'UPI',
    modeKhata: 'Udhaar',

    khataTitle: 'Udhaar',
    addCustomerBtn: '+ Add Customer',
    totalPendingAllLabel: 'Total Pending Udhaar',
    pendingBalancePrefix: 'Pending:',
    clearedBalanceText: 'Cleared: ₹0',
    noCustomersFound: 'No customer found',
    openPassbookBtn: 'Open Khata',
    addCreditBtn: '+ Add Udhaar',
    receivePaymentBtn: '- Receive Payment',
    sendWhatsAppBtn: 'Send Balance on WhatsApp',
    sendSelectedBillsWhatsAppBtn: 'Send Selected Bills on WhatsApp',
    selectAllBillsLabel: 'Select All',
    passbookHistoryTitle: 'Customer Bills & History',
    noTransactionsYet: 'No transactions for this date',
    entryTypeUdhaar: 'Udhaar',
    entryTypeJama: 'Paid',
    entryTypePaidCash: 'Cash Bill',
    entryTypePaidUpi: 'UPI Bill',
    colSrNo: 'Sr. No.',
    colBillNo: 'Bill No.',
    colCustomerName: 'Customer Name',
    colDate: 'Date',
    colType: 'Type',
    colAmount: 'Amount',
    colPrint: 'Print',
    printInvoiceBtn: 'Print Invoice',
    newCustomerModalTitle: 'Add New Customer',
    customerNameMrLabel: 'Customer Name (Marathi)',
    customerNameEnLabel: 'Customer Name (English)',
    customerMobileLabel: 'Mobile Number (10 digits)',
    openingBalanceLabel: 'Previous Pending Amount if any (₹)',
    addCreditModalTitle: 'Add Udhaar',
    receivePaymentModalTitle: 'Receive Payment',
    enterAmountLabel: 'Enter Amount (₹)',
    enterNoteLabel: 'Short Note (optional)',
    creditNotePlaceholder: 'e.g. Monthly groceries',
    paymentNotePlaceholder: 'e.g. Cash received',
    paymentMethodLabel: 'How was payment received?',
    fullPendingBtn: 'Fill Full Pending',
    confirmCreditBtn: 'Save Udhaar',
    confirmPaymentBtn: 'Save Payment',
    customerAddedToast: 'New customer added!',
    creditSavedToast: 'Udhaar amount added!',
    paymentSavedToast: 'Payment received & saved!',
    defaultCreditNote: 'Kirana items on Udhaar',
    defaultPaymentNote: 'Udhaar payment received',
    billNotePrefix: 'Bill #',

    stockTitle: 'Items & Rates',
    addItemBtn: '+ Add New Item',
    searchStockPlaceholder: 'Search item (sugar, sakhar, साखर) or barcode...',
    filterAll: 'All Items',
    filterLowStock: 'Low Stock',
    filterLooseKg: 'Loose (Kg)',
    colItemName: 'Item Name',
    colBarcode: 'Barcode',
    colUnit: 'Unit',
    colRate: 'Selling Rate',
    colStock: 'Current Stock',
    colAction: 'Action',
    lowStockBadge: 'Low Stock',
    unitKg: 'Kg (Weight)',
    unitPiece: 'Piece (Count)',
    unitKatta: 'Katta (30kg / 50kg Bag)',
    unitKgShort: 'kg',
    unitPieceShort: 'pc',
    unitKattaShort: 'bag',
    bagWeightLabel: 'Bag Weight (kg)',
    bagWeightPlaceholder: 'e.g. 30 or 50',
    addItemModalTitle: 'Add New Item',
    editItemModalTitle: 'Edit Item & Rate',
    nameMrLabel: 'Marathi Name',
    nameEnLabel: 'English Name',
    phoneticLabel: 'Phonetic Search Words (e.g. sakhar, tandul, dal)',
    phoneticPlaceholder: 'e.g. moog dal mung',
    barcodeLabel: 'Barcode Number',
    generateBarcodeBtn: 'Auto-Generate',
    unitLabel: 'Selling Unit',
    rateLabel: 'Selling Rate (₹)',
    currentStockLabel: 'Current Stock',
    lowStockLimitLabel: 'Low Stock Alert Limit',
    itemSavedToast: 'Item saved!',
    itemDeletedToast: 'Item removed',
    noStockItemsFound: 'No items found',

    hisabTitle: "Today's Cash & Backup",
    dateFilterToday: 'Today',
    dateFilterYesterday: 'Yesterday',
    dateFilterAll: 'All Dates',
    dateFilterPickDate: 'Pick Date:',
    todayTotalSales: 'Total Sales',
    cashInDrawer: 'Cash in Drawer',
    upiReceived: 'UPI Received',
    newUdhaarGiven: 'Udhaar Given',
    billsCountSuffix: 'bills',
    fromBillsLabel: 'Bills',
    fromKhataJamaLabel: 'Udhaar Paid',
    todaysBillsTitle: 'Bills List',
    noBillsForDate: 'No bills found for this date',
    viewReceiptBtn: 'Print',
    backupSectionTitle: 'Data Backup & Safety',
    backupSectionDesc: 'Download a backup file at the end of the day to keep all your items, customer khata, and daily bills safe.',
    lastBackupLabel: 'Last Backup:',
    neverBackedUp: 'Not downloaded yet (Auto-saved in browser)',
    downloadBackupBtn: 'Download Backup File',
    restoreBackupBtn: 'Restore Backup',
    backupDownloadedToast: 'Backup file downloaded safely!',
    restoreConfirmTitle: 'Restore data from this backup file?',
    restoreConfirmMessage: 'Uploading this file will replace current shop data with all items, customers, and bills stored inside the backup file.',
    restoreConfirmBtn: 'Yes, Restore Backup',
    restoreSuccessToast: 'Backup restored successfully!',
    restoreErrorToast: 'Invalid backup file. Please choose a valid JSON backup file.',
  },
};

export function formatRupees(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasDecimals = Math.abs(rounded - Math.round(rounded)) > 0.001;
  return `₹${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuantity(
  qty: number,
  unit: UnitType,
  lang: Language,
  bagWeightKg?: number
): string {
  if (unit === 'piece') {
    const clean = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
    return lang === 'mr' ? `${clean} नग` : `${clean} pc`;
  }
  if (unit === 'katta') {
    const clean = Number.isInteger(qty)
      ? qty.toString()
      : String(Math.round(qty * 100) / 100);
    const weightTag = bagWeightKg ? ` (${bagWeightKg}kg)` : '';
    return lang === 'mr'
      ? `${clean} कट्टा${weightTag}`
      : `${clean} Bag${weightTag}`;
  }
  if (qty < 1) {
    const grams = Math.round(qty * 1000);
    return lang === 'mr' ? `${grams} ग्रॅम` : `${grams}g`;
  }
  const cleanKg = Math.round(qty * 1000) / 1000;
  return lang === 'mr' ? `${cleanKg} किलो` : `${cleanKg} kg`;
}

export function formatUnitRateLabel(
  unit: UnitType,
  lang: Language,
  bagWeightKg?: number
): string {
  const t = translations[lang];
  if (unit === 'kg') return t.unitKgShort;
  if (unit === 'piece') return t.unitPieceShort;
  return bagWeightKg
    ? `${t.unitKattaShort} (${bagWeightKg}kg)`
    : t.unitKattaShort;
}

export function formatTodayDate(lang: Language): string {
  const now = new Date();
  return now.toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string, lang: Language): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string, lang: Language): string {
  const d = new Date(iso);
  return d.toLocaleString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPaymentMode(mode: PaymentMode, lang: Language): string {
  const t = translations[lang];
  if (mode === 'cash') return t.modeCash;
  if (mode === 'upi') return t.modeUpi;
  return t.modeKhata;
}

export function getDisplayName(
  item: { nameMr: string; nameEn: string },
  lang: Language
): string {
  return lang === 'mr' ? item.nameMr : item.nameEn;
}

export function toLocalDateKey(dateOrIso: Date | string): string {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isSameDay(isoA: string, dateB: Date): boolean {
  return toLocalDateKey(isoA) === toLocalDateKey(dateB);
}

export function matchesProductQuery(
  product: { nameMr: string; nameEn: string; phonetic: string; barcode: string },
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${product.nameMr} ${product.nameEn} ${product.phonetic} ${product.barcode}`.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((tok) => haystack.includes(tok));
}
