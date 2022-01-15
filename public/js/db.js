let db;

const request = indexedDB.open('pwa_budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', {autoIncrement: true});
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction()
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

function saveTransactionForBudget(record) {
    const transact = db.transaction(['new_transaction'], 'readwrite');
    const transactObjectStore = transact.objectStore('new_transaction');
    transactObjectStore.add(record)
}

function uploadTransaction() {
    const transact = db.transaction(['new_transaction'], 'readwrite');
    const transactObjectStore = transact.objectStore('new_transaction');
    const getAll = transactObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transact = db.transaction(['new_transaction'], 'readwrite');
                const transactObjectStore = transact.objectStore('new_transaction');
                transactObjectStore.clear();

                alert('Transactions submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

window.addEventListener('online', uploadTransaction);