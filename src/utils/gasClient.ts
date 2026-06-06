import { InventoryItem, Transaction, SyncConfig, SyncStatus, User } from '../types';

export async function pingGasWebApp(url: string, token: string): Promise<boolean> {
  if (!url) return false;
  try {
    // Standard GET check with token validation
    const targetUrl = new URL(url);
    targetUrl.searchParams.append('action', 'getData');
    targetUrl.searchParams.append('token', token);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (response.ok) {
      const data = await response.json();
      return !!data.success;
    }
    return false;
  } catch (error) {
    console.warn('Ping failed, but this might be normal if script redirected without CORS or is uninitialized.', error);
    // Since Google scripts redirect 302, sometimes simple mode: 'no-cors' works but doesn't return body. 
    // We try to catch and analyze.
    return false;
  }
}

export async function fetchFromGas(config: SyncConfig): Promise<{ 
  inventory: InventoryItem[]; 
  transactions: Transaction[];
  users?: User[];
  userPasswords?: { [userId: string]: string };
} | null> {
  if (!config.webAppUrl) return null;
  
  try {
    const targetUrl = new URL(config.webAppUrl);
    targetUrl.searchParams.append('action', 'getData');
    targetUrl.searchParams.append('token', config.authToken);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }

    const result = await response.json();
    if (result && result.success) {
      return {
        inventory: result.inventory || [],
        transactions: result.transactions || [],
        users: result.users,
        userPasswords: result.userPasswords
      };
    } else {
      throw new Error(result.error || 'Server responded with failure execution status.');
    }
  } catch (error: any) {
    console.error('Error fetching sheet data:', error);
    throw new Error(error.message || 'Error occurred while contacting the Apps Script API.');
  }
}

export async function pushAllToGas(
  config: SyncConfig, 
  items: InventoryItem[], 
  transactions: Transaction[],
  users?: User[],
  userPasswords?: { [userId: string]: string }
): Promise<boolean> {
  if (!config.webAppUrl) return false;

  try {
    const payload = {
      action: 'syncAll',
      token: config.authToken,
      items: items,
      transactions: transactions,
      users: users || null,
      userPasswords: userPasswords || null
    };

    // Note: Deployed Apps Script prefers POST for bulk payloads
    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Standard CORS-bypass for simple text POST in Apps Script
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Push unsuccessful. HTTP status: ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('Error pushing data to sheet:', error);
    throw error;
  }
}

export async function pushUserToGas(
  config: SyncConfig,
  user: User,
  passwordPlain: string
): Promise<boolean> {
  if (!config.webAppUrl) return false;

  try {
    const payload = {
      action: 'saveUser',
      token: config.authToken,
      user: user,
      passwordPlain: passwordPlain
    };

    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`User write failed. Status: ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('Error pushing single user update to sheet:', error);
    throw error;
  }
}

export async function pushItemToGas(config: SyncConfig, item: InventoryItem, transaction?: Transaction): Promise<boolean> {
  if (!config.webAppUrl) return false;

  try {
    const payload = {
      action: 'saveItem',
      token: config.authToken,
      item: item,
      transaction: transaction || null
    };

    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Item write failed. Status: ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('Error pushing single item update to sheet:', error);
    throw error;
  }
}

export async function deleteItemFromGas(config: SyncConfig, itemId: string): Promise<boolean> {
  if (!config.webAppUrl) return false;

  try {
    const payload = {
      action: 'deleteItem',
      token: config.authToken,
      id: itemId
    };

    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Delete failed. Status: ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('Error deleting item from sheet:', error);
    throw error;
  }
}
