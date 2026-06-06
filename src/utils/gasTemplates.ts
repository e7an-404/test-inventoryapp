export const GAS_CODE_GS = `/**
 * Google Sheets Apps Script - Inventory Database Engine
 * ----------------------------------------------------
 * Dual Functionality:
 * 1. Provides a JSON API backend for modern React/web applications (CORS-friendly API)
 * 2. Emits a clean, responsive standalone web app served directly in the Spreadsheet!
 * 
 * Setup instructions:
 * 1. Open Google Sheets.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this script.
 * 4. Create a new HTML file named 'Index.html' and paste the provided index HTML code.
 * 5. Update Auth Token (optional, for secure web API access).
 * 6. Click Deploy > New Deployment. Select 'Web app'.
 * 7. Set 'Execute as' to 'Me' and 'Who has access' to 'Anyone'.
 * 8. Copy the Web App URL and paste it in the React application!
 */

const AUTH_TOKEN = "inventory_secret_123"; // Customize this token to secure your API
const MAIN_SHEET_NAME = "Inventory";
const LOG_SHEET_NAME = "Transactions";
const USERS_SHEET_NAME = "Users";

function doGet(e) {
  const action = e.parameter.action;
  if (action) {
    return handleApiRequest(e);
  }
  
  try {
    const template = HtmlService.createTemplateFromFile('Index');
    return template.evaluate()
      .setTitle('Sheets Inventory Portal')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch(error) {
    return HtmlService.createHtmlOutput("<h2>Setup Required</h2><p>Please make sure you have added an HTML file named <b>Index.html</b> to your Apps Script project.</p><pre>" + error.toString() + "</pre>");
  }
}

function doPost(e) {
  return handleApiRequest(e);
}

function handleApiRequest(e) {
  let params = {};
  let body = null;
  
  if (e.parameter) {
    for (let key in e.parameter) {
      params[key] = e.parameter[key];
    }
  }
  
  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch(err) {
      body = e.postData.contents;
    }
  }

  const action = params.action || (body && body.action);
  const token = params.token || (body && body.token) || e.parameter.token;
  
  if (AUTH_TOKEN && AUTH_TOKEN !== "" && token !== AUTH_TOKEN) {
    return createJsonResponse({ success: false, error: "Unauthorized. Invalid token." });
  }

  initializeSheet();
  
  try {
    switch (action) {
      case "getData":
        const usersList = getSystemUsers();
        const responseUsers = usersList.map(function(u) {
          return { id: u.id, username: u.username, role: u.role, name: u.name, createdAt: u.createdAt };
        });
        const responsePasswords = {};
        usersList.forEach(function(u) {
          responsePasswords[u.id] = u.password;
        });
        return createJsonResponse({ 
          success: true, 
          inventory: getInventoryItems(), 
          transactions: getRecentTransactions(),
          users: responseUsers,
          userPasswords: responsePasswords
        });
        
      case "syncAll":
        if (body && body.items) {
          syncAllItemsAndTransactions(body.items, body.transactions || [], body.users || null, body.userPasswords || null);
          return createJsonResponse({ success: true, message: "Inventory and Users fully synced with sheet." });
        }
        return createJsonResponse({ success: false, error: "No items list provided." });

      case "saveItem":
        const itemToSave = body && body.item ? body.item : JSON.parse(params.item);
        const saved = saveSingleItem(itemToSave);
        if (body && body.transaction) {
          logTransaction(body.transaction);
        }
        return createJsonResponse({ success: true, item: saved });
        
      case "deleteItem":
        const idToDelete = params.id || (body && body.id);
        const deleted = deleteSingleItem(idToDelete);
        return createJsonResponse({ success: deleted });
        
      case "logTransaction":
        const txObj = body && body.transaction ? body.transaction : JSON.parse(params.transaction);
        logTransaction(txObj);
        return createJsonResponse({ success: true });

      case "saveUser":
        const userToSave = body && body.user ? body.user : JSON.parse(params.user);
        const passToSave = body && body.passwordPlain ? body.passwordPlain : params.passwordPlain;
        saveSingleUser(userToSave, passToSave);
        return createJsonResponse({ success: true });
        
      default:
        return createJsonResponse({ success: false, error: "Unknown action: " + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function initializeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let invSheet = ss.getSheetByName(MAIN_SHEET_NAME);
  if (!invSheet) {
    invSheet = ss.insertSheet(MAIN_SHEET_NAME);
    const headers = ["ID", "SKU", "Name", "Category", "Quantity", "Unit", "Unit Price", "Min StockLimit", "Location", "Notes", "Last Updated"];
    invSheet.appendRow(headers);
    invSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
    invSheet.setFrozenRows(1);
    
    const seeds = [
      ["item_1", "SKU-PROD-A", "Premium Brass Fitting (3/4)", "Plumbing", "45", "Pcs", "12.55", "15", "Ais-B2", "High quality rust-proof brass threads", new Date().toISOString()],
      ["item_2", "SKU-ELEC-O", "Heavy Duty Conduit (3m)", "Electrical", "12", "Pcs", "8.90", "15", "Yard-3", "Schedule 40 PVC outdoor piping", new Date().toISOString()]
    ];
    seeds.forEach(function(row) { invSheet.appendRow(row); });
  }

  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    const headers = ["Transaction ID", "Item ID", "SKU", "Item Name", "Type", "Quantity", "Timestamp", "Operator", "Notes"];
    logSheet.appendRow(headers);
    logSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
    logSheet.setFrozenRows(1);
  }

  let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET_NAME);
    const headers = ["User ID", "Username", "Role", "Name", "Password (Plaintext)", "Created At"];
    usersSheet.appendRow(headers);
    usersSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
    usersSheet.setFrozenRows(1);
    
    const seeds = [
      ["usr_admin", "admin", "admin", "Manajer Admin", "admin", new Date().toISOString()],
      ["usr_operator", "operator", "operator", "Petugas Operator", "operator", new Date().toISOString()]
    ];
    seeds.forEach(function(row) { usersSheet.appendRow(row); });
  }
}

function getInventoryItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    items.push({
      id: String(row[0]),
      sku: String(row[1]),
      name: String(row[2]),
      category: String(row[3]),
      quantity: Number(row[4]) || 0,
      unit: String(row[5]),
      unitPrice: Number(row[6]) || 0,
      minStock: Number(row[7]) || 0,
      location: String(row[8]),
      notes: String(row[9]),
      lastUpdated: String(row[10] || new Date().toISOString())
    });
  }
  return items;
}

// Read recent transactions from Spreadsheet
function getRecentTransactions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const transactions = [];
  const startRow = Math.max(1, data.length - 150);
  for (let i = data.length - 1; i >= startRow; i--) {
    const row = data[i];
    if (!row[0]) continue;
    transactions.push({
      id: String(row[0]),
      itemId: String(row[1]),
      sku: String(row[2]),
      itemName: String(row[3]),
      type: String(row[4]),
      quantity: Number(row[5]) || 0,
      timestamp: String(row[6]),
      operator: String(row[7]),
      notes: String(row[8])
    });
  }
  return transactions;
}

function getSystemUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    initializeSheet();
    sheet = ss.getSheetByName(USERS_SHEET_NAME);
  }
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    users.push({
      id: String(row[0]),
      username: String(row[1]),
      role: String(row[2]),
      name: String(row[3]),
      password: String(row[4]),
      createdAt: String(row[5] || new Date().toISOString())
    });
  }
  return users;
}

function getAppInventoryData() {
  initializeSheet();
  const usersList = getSystemUsers();
  const responseUsers = usersList.map(function(u) {
    return { id: u.id, username: u.username, role: u.role, name: u.name, createdAt: u.createdAt };
  });
  const responsePasswords = {};
  usersList.forEach(function(u) {
    responsePasswords[u.id] = u.password;
  });
  return {
    inventory: getInventoryItems(),
    transactions: getRecentTransactions(),
    users: responseUsers,
    userPasswords: responsePasswords
  };
}

function saveSingleItem(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MAIN_SHEET_NAME);
  if (!sheet) {
    initializeSheet();
    sheet = ss.getSheetByName(MAIN_SHEET_NAME);
  }
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const itemIdToFind = String(item.id);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === itemIdToFind) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowValues = [
    item.id,
    item.sku,
    item.name,
    item.category,
    item.quantity,
    item.unit,
    item.unitPrice,
    item.minStock,
    item.location,
    item.notes,
    item.lastUpdated || new Date().toISOString()
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    if (!item.id || item.id === "") {
      item.id = "item_" + new Date().getTime();
      rowValues[0] = item.id;
    }
    sheet.appendRow(rowValues);
  }
  return item;
}

function deleteSingleItem(itemId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MAIN_SHEET_NAME);
  if (!sheet) {
    initializeSheet();
    sheet = ss.getSheetByName(MAIN_SHEET_NAME);
  }
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(itemId)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function logTransaction(tx) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    initializeSheet();
    sheet = ss.getSheetByName(LOG_SHEET_NAME);
  }
  const rowValues = [
    tx.id || "tx_" + new Date().getTime(),
    tx.itemId,
    tx.sku || "",
    tx.itemName,
    tx.type,
    tx.quantity,
    tx.timestamp || new Date().toISOString(),
    tx.operator || "Operator",
    tx.notes || ""
  ];
  sheet.appendRow(rowValues);
}

function saveSingleUser(user, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    initializeSheet();
    sheet = ss.getSheetByName(USERS_SHEET_NAME);
  }
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const userIdToFind = String(user.id);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === userIdToFind) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowValues = [
    user.id,
    user.username,
    user.role,
    user.name,
    password || "",
    user.createdAt || new Date().toISOString()
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function syncAllItemsAndTransactions(items, transactions, users, userPasswords) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let invSheet = ss.getSheetByName(MAIN_SHEET_NAME);
  if (!invSheet) {
    initializeSheet();
    invSheet = ss.getSheetByName(MAIN_SHEET_NAME);
  }
  
  const invHeaders = ["ID", "SKU", "Name", "Category", "Quantity", "Unit", "Unit Price", "Min StockLimit", "Location", "Notes", "Last Updated"];
  invSheet.clearContents();
  invSheet.getRange(1, 1, 1, invHeaders.length).setValues([invHeaders]).setFontWeight("bold").setBackground("#e2e8f0");
  
  if (items.length > 0) {
    const invRows = items.map(function(item) {
      return [
        String(item.id),
        String(item.sku || ""),
        String(item.name || "Unnamed Item"),
        String(item.category || "General"),
        Number(item.quantity) || 0,
        String(item.unit || "Pcs"),
        Number(item.unitPrice) || 0,
        Number(item.minStock) || 0,
        String(item.location || ""),
        String(item.notes || ""),
        String(item.lastUpdated || new Date().toISOString())
      ];
    });
    invSheet.getRange(2, 1, invRows.length, invHeaders.length).setValues(invRows);
  }
  
  if (transactions && transactions.length > 0) {
    let txSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!txSheet) {
      txSheet = ss.insertSheet(LOG_SHEET_NAME);
    }
    
    const txHeaders = ["Transaction ID", "Item ID", "SKU", "Item Name", "Type", "Quantity", "Timestamp", "Operator", "Notes"];
    txSheet.clearContents();
    txSheet.getRange(1, 1, 1, txHeaders.length).setValues([txHeaders]).setFontWeight("bold").setBackground("#e2e8f0");
    
    const sortedTx = transactions.slice().sort(function(a, b) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    const cappedTx = sortedTx.slice(-500);
    if (cappedTx.length > 0) {
      const txRows = cappedTx.map(function(tx) {
        return [
          String(tx.id),
          String(tx.itemId),
          String(tx.sku || ""),
          String(tx.itemName || ""),
          String(tx.type),
          Number(tx.quantity) || 0,
          String(tx.timestamp || new Date().toISOString()),
          String(tx.operator || "Operator"),
          String(tx.notes || "")
        ];
      });
      txSheet.getRange(2, 1, txRows.length, txHeaders.length).setValues(txRows);
    }
  }

  if (users && users.length > 0) {
    let uSheet = ss.getSheetByName(USERS_SHEET_NAME);
    if (!uSheet) {
      uSheet = ss.insertSheet(USERS_SHEET_NAME);
    }
    const uHeaders = ["User ID", "Username", "Role", "Name", "Password (Plaintext)", "Created At"];
    uSheet.clearContents();
    uSheet.getRange(1, 1, 1, uHeaders.length).setValues([uHeaders]).setFontWeight("bold").setBackground("#e2e8f0");
    
    const uRows = users.map(function(u) {
      const p = userPasswords ? userPasswords[u.id] || "" : "";
      return [
        String(u.id),
        String(u.username || ""),
        String(u.role || "operator"),
        String(u.name || ""),
        String(p),
        String(u.createdAt || new Date().toISOString())
      ];
    });
    uSheet.getRange(2, 1, uRows.length, uHeaders.length).setValues(uRows);
  }
}
`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sheets Standalone Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen p-6 font-sans">
  <div class="max-w-6xl mx-auto">
    <header class="bg-cyan-950 text-white rounded-xl p-5 mb-5 flex justify-between items-center">
      <div>
        <h1 class="text-xl font-extrabold flex items-center gap-1.5">Sheets Inventory Portal</h1>
        <p class="text-[10px] text-cyan-200 uppercase tracking-widest font-mono mt-0.5">Standalone Google Sheets Dashboard</p>
      </div>
      <button onclick="loadData()" class="bg-cyan-600 hover:bg-cyan-500 text-xs px-3.5 py-2 rounded-lg transition">Refresh</button>
    </header>

    <main class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div id="loading" class="py-12 text-center text-slate-400 text-sm">
        Retrieving live inventory rows...
      </div>
      <table id="dataTable" class="w-full text-left border-collapse hidden">
        <thead>
          <tr class="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
            <th class="py-3 px-4">SKU Code</th>
            <th class="py-3 px-4">Product Name</th>
            <th class="py-3 px-4 text-center">Remaining Stock</th>
            <th class="py-3 px-4 text-right">Unit Price</th>
            <th class="py-3 px-4 text-right">Valuation</th>
            <th class="py-3 px-4">Location</th>
          </tr>
        </thead>
        <tbody id="tableBody" class="divide-y divide-slate-100 text-sm">
        </tbody>
      </table>
    </main>
  </div>

  <script>
    window.onload = function() { loadData(); };

    function loadData() {
      document.getElementById('loading').classList.remove('hidden');
      document.getElementById('dataTable').classList.add('hidden');
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(onDataLoaded)
          .withFailureHandler(function(err){ alert('Error: ' + err); })
          .getAppInventoryData();
      } else {
        onDataLoaded({
          inventory: [
            { id: "item_1", sku: "SKU-PROD-A", name: "Premium Brass Fitting (3/4)", quantity: 45, unit: "Pcs", unitPrice: 12.50, location: "Ais-B2" },
            { id: "item_2", sku: "SKU-ELEC-O", name: "Heavy Duty Conduit (3m)", quantity: 12, unit: "Pcs", unitPrice: 8.90, location: "Yard-3" }
          ]
        });
      }
    }

    function onDataLoaded(data) {
      var body = document.getElementById('tableBody');
      body.innerHTML = '';
      var items = data.inventory || [];
      
      if(items.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">Inventory sheet is currently empty.</td></tr>';
      } else {
        items.forEach(function(item) {
          var remaining = item.quantity || 0;
          var valuation = remaining * (item.unitPrice || 0);
          var row = document.createElement('tr');
          row.className = 'hover:bg-slate-50/50';
          row.innerHTML = 
            '<td class="py-3.5 px-4 font-mono text-xs font-semibold text-cyan-900">' + escapeHtml(item.sku) + '</td>' +
            '<td class="py-3.5 px-4 text-slate-700 font-medium">' + escapeHtml(item.name) + '</td>' +
            '<td class="py-3.5 px-4 text-center font-bold font-mono text-slate-800">' + remaining + ' <span class="text-[10px] text-slate-400 font-normal">' + escapeHtml(item.unit || "Pcs") + '</span></td>' +
            '<td class="py-3.5 px-4 text-right font-mono text-slate-500">Rp ' + (item.unitPrice || 0).toLocaleString('id-ID') + '</td>' +
            '<td class="py-3.5 px-4 text-right font-mono font-bold text-slate-800">Rp ' + (valuation || 0).toLocaleString('id-ID') + '</td>' +
            '<td class="py-3.5 px-4 text-slate-400 text-xs">' + escapeHtml(item.location || "--") + '</td>';
          body.appendChild(row);
        });
      }
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('dataTable').classList.remove('hidden');
    }

    function escapeHtml(text) {
      if (!text) return "";
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }
  </script>
</body>
</html>
`;
