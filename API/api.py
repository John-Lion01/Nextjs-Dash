from flask import Flask, jsonify, request, redirect
import json, os, uuid

BD = os.path.dirname(__file__)
file = os.path.join(BD, "api.json")
new_file = os.path.join(BD, "dataBase.json")

Data:dict = {}

def invoice_key(x) :
    return x["date"]

def read_data() :
    global Data
    with open(new_file, "r") as doc :
        Data = json.load(doc)
    # Data["invoices"].sort(key=invoice_key, reverse=False)
    return Data
        
def update_data(data) :
    with open(new_file, "w") as doc :
        json.dump(data, doc, indent=4)
    read_data()
read_data()
Data['invoices'].reverse()

def comp(elt1, elt2) :
    return elt2.lower() in str(elt1).lower() 

def get_filtered_invoices() :
    filtered_invoices = []
    for inv in Data['invoices'] :
        c_id = inv['customer_id']
        custom = {}
        for cust in Data['customers'] :
            if cust['id'] == c_id :
                custom = cust
                break

        filtered_invoices.append({
            'id': inv['id'],
            'customer_id': c_id,
            'name': cust['name'],
            'email': cust['email'],
            'image_url': cust['image_url'],
            'date': inv['date'],
            'amount': inv['amount'],
            'status': inv['status'],
        })
    filtered_invoices.sort(key=lambda x : x['date'], reverse=False)
    read_data()
    Data['filtered_invoices'] = filtered_invoices
    update_data(Data)
    return filtered_invoices

base_url = "http://localhost:5000/"

all_urls = {
    "users" : base_url + "users",
    "customers" : base_url + "customers",
    "invoices" : base_url + "invoices",
    "revenue" : base_url + "revenue",
    "latestInvoices" : base_url + "latestInvoices",
    "numbers" : base_url + "numbers",
    "filterinvoices" : base_url + "filterinvoices",
    "fetchcustomers" : base_url + "fetchcustomers",
}

app = Flask(__name__)

@app.route('/')
def home(param=None) :
    all_urls["param"] = param
    return jsonify(all_urls)

@app.route('/users')
def users() :
    return Data['users']

@app.route('/customers')
def customers() :
    return Data['customers']

@app.route('/invoices')
def invoices() :
    Data['invoices'].sort(key='date')
    return Data['invoices']

@app.route('/revenue')
def revenue() :
    return Data['revenue']

@app.route('/latestInvoices')
def latestInvoices() :
    return Data['latestInvoices']
    
@app.route('/numbers')
def numbers() :
    numberOfCustomers = len(Data['customers'])
    numberOfInvoices = len(Data['invoices'])
    invoices_list = Data['invoices']
    pending = sum(
        [inv['amount'] for inv in invoices_list if inv["status"] == "pending"]
    )    
    payed = sum(
        [inv['amount'] for inv in invoices_list if inv["status"] == "paid"]
    )
    return {
        "numberOfCustomers" : numberOfCustomers,
        "numberOfInvoices" : numberOfInvoices,
        "totalPendingInvoices" : pending,
        "totalPaidInvoices" : payed
    }
    
@app.route('/filterinvoices/')
def filterinvoices() :
    filtered_invoices = get_filtered_invoices()
    query = request.args.get('query', default='')
    page = request.args.get('page', default='1')
    per_page = request.args.get('per_page', default='')
    
    result = []
    if query :
        for inv in filtered_invoices :
            if (comp(inv['name'], query)) or (comp(inv['email'], query)) or \
            (comp(inv['amount'], query)) or (comp(inv['date'], query)) or \
            (comp(inv['status'], query)):
                result.append(inv)
    else :
        result = filtered_invoices
    
    try :
        page, per_page = int(page), int(per_page)
    except :
        page, per_page = 1, len(filtered_invoices)
    
    page = page if page > 0 else 1
    begin = (page-1)*per_page
    end = begin + per_page

    result.reverse()
    return result[begin:end]

@app.route('/fetchcustomers')
def fetchcustomers() :
    rs = []
    for cust in Data['customers'] :
        rs.append({
            'id' : cust['id'],
            'name' : cust['name']
        })
    return rs

# create
@app.route('/create_invoice', methods=['POST'])
def create_invoices() :
    invoice_keys = ["id", "customer_id", "amount", "status", "date"]
    invoice_keys.sort()
    if request.method == 'POST' :
        cont = request.get_data().decode()
        cont:dict = json.loads(cont)
        cont_key = list(dict(cont).keys())
        cont_key.sort()

        if cont_key != invoice_keys :
            return jsonify({
                "status" : "erreur",
                "message" : "contenue invalide"
            }), 400

        invoice = {
            "id" : str(uuid.uuid4()),
            "customer_id" : cont["customer_id"], 
            "amount" : cont["amount"], 
            "status" : cont["status"], 
            "date" : cont["date"]
        }

        read_data()
        Data['invoices'].append(invoice)
        update_data(Data)
        return jsonify({
            "status" : "success"

        }), 201
    else :
        return jsonify("Error methode"), 404

@app.route('/invoice_by_id/<id>/')
def invoice_by_id(id) :
    rinv = []
    for inv in Data['invoices'] :
        if inv['id'] == id :
            rinv.append(inv)
            break
    
    return rinv

# update
@app.route('/update_invoice/<id>/', methods=['POST'])
def update_invoice(id) :
    read_data()
    rinv = None
    for inv in Data['invoices'] :
        if inv['id'] == id :
            rinv = inv
            break
    if not rinv :
        return jsonify({
                "status" : "erreur",
                "message" : "contenue invalide"
            }), 400
    
    cont    = request.get_data().decode()
    cont:dict = dict(json.loads(cont))
    rinv['customer_id']   = cont['customer_id']
    rinv['amount']        = cont['amount']
    rinv['status']        = cont['status']
    rinv['date']          = cont['date']
    
    update_data(Data)
    return jsonify({
            "status" : "success"
        }), 201

# delete
@app.route('/delete_invoice/<id>/')
def delete_invoice(id):
    rinv = None
    read_data()
    for inv in Data['invoices'] :
        if inv['id'] == id :
            rinv = inv
            break
    if not rinv :
        return jsonify({
                "status" : "erreur",
                "message" : "contenue invalide"
            }), 400

    Data['invoices'].remove(rinv)
    update_data(Data)
    return jsonify({
        'status' : 'success'
    }), 201

app.run(debug=True)
