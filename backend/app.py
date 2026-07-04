import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Enable CORS for the frontend origin (http://localhost:5173)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        "message": "EcoTrack Backend Running"
    })

@app.route('/api/calculate', methods=['POST'])
def calculate_emissions():
    data = request.get_json() or {}
    
    # 1. Transport calculations
    transport_mode = data.get('transportMode', 'Walking')
    distance = float(data.get('distance', 0) or 0)
    occupants = max(int(data.get('occupants', 1) or 1), 1)
    
    transport_factors = {
        'Car Petrol': 0.18,
        'Car Diesel': 0.17,
        'Bike': 0.10,
        'Bus': 0.04,
        'Train': 0.03,
        'Flight': 0.25,
        'Walking': 0.0,
        'Cycling': 0.0
    }
    
    factor = transport_factors.get(transport_mode, 0.0)
    # Split emission factor by occupancy only for personal vehicles
    if transport_mode in ['Car Petrol', 'Car Diesel', 'Bike']:
        transport_emissions = (distance * factor) / occupants
    else:
        transport_emissions = distance * factor
        
    # 2. Diet calculations
    diet_type = data.get('dietType', 'Vegetarian')
    servings = float(data.get('servings', 1) or 0)
    
    diet_factors = {
        'Vegan': 0.5,
        'Vegetarian': 0.8,
        'Pescatarian': 1.2,
        'Low Meat': 1.5,
        'High Meat': 2.3
    }
    
    diet_emissions = servings * diet_factors.get(diet_type, 0.8)
    
    # 3. Energy calculations
    energy_source = data.get('energySource', 'None')
    energy_used = float(data.get('energyUsed', 0) or 0)
    household_size = max(int(data.get('householdSize', 1) or 1), 1)
    
    energy_factors = {
        'Electricity': 0.4,
        'Natural Gas': 0.2,
        'Heating Oil': 0.27,
        'None': 0.0
    }
    
    energy_emissions = (energy_used * energy_factors.get(energy_source, 0.0)) / household_size
    
    total_emissions = transport_emissions + diet_emissions + energy_emissions
    
    return jsonify({
        'transportEmissions': round(transport_emissions, 2),
        'dietEmissions': round(diet_emissions, 2),
        'energyEmissions': round(energy_emissions, 2),
        'totalEmissions': round(total_emissions, 2)
    })

if __name__ == '__main__':
    # Default to port 5000 if not specified in environment
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
