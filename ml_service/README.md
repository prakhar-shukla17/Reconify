# ML Analysis Service

Advanced Machine Learning service for IT Asset Management predictions and analytics.

## Features

🧠 **Advanced ML Algorithms**
- Storage forecasting with multiple models (Linear, Polynomial, Random Forest)
- Memory leak detection using statistical tests
- CPU pattern recognition and spike prediction
- Anomaly detection with Isolation Forest
- Health trajectory forecasting

📊 **Comprehensive Analysis**
- Multi-algorithm ensemble predictions
- Confidence scoring for predictions
- Trend analysis and pattern recognition
- Resource exhaustion timeline prediction
- Performance degradation analysis

🔬 **Scientific Libraries**
- scikit-learn for machine learning models
- scipy for statistical analysis
- pandas and numpy for data processing
- Advanced signal processing for pattern detection

## Quick Start

### 1. Install Dependencies

```bash
# Automatic installation (recommended)
python ml_service/start_ml_service.py

# Or manual installation
cd ml_service
pip install -r requirements.txt
```

### 2. Start the Service

```bash
# Using startup script (recommended)
python ml_service/start_ml_service.py

# Or directly
cd ml_service
python app.py
```

The service will start on `http://localhost:5000`

### 3. Verify Service

```bash
curl http://localhost:5000/health
```

## API Endpoints

### POST /predict
Main prediction endpoint for single asset analysis.

**Request:**
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "current_data": {
    "cpu_percent": 45.2,
    "ram_percent": 67.8,
    "storage_percent": 78.5,
    "temperature": 65.0
  },
  "historical_data": [
    {
      "cpu_percent": 42.1,
      "ram_percent": 65.2,
      "storage_percent": 76.8,
      "temperature": 63.5,
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "storage_full_in_days": 45,
  "storage_confidence": 0.87,
  "storage_growth_acceleration": 1.2,
  "memory_leak_probability": 0.15,
  "memory_pressure_in_hours": 72.5,
  "memory_volatility": 3.2,
  "cpu_spike_probability": 0.23,
  "cpu_baseline_shift": 2.1,
  "health_trend_7_days": -1.5,
  "health_trend_30_days": -0.8,
  "anomaly_score": 0.156,
  "is_anomaly": false,
  "performance_degradation_risk": 0.34,
  "resource_exhaustion_timeline": {
    "storage_critical_days": 12.5
  }
}
```

### POST /analyze_batch
Batch analysis for multiple assets.

**Request:**
```json
{
  "assets": [
    {
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "current_data": {...},
      "historical_data": [...]
    }
  ]
}
```

### GET /health
Health check endpoint.

### GET /model_info
Information about ML models and features.

## ML Models and Techniques

### Storage Forecasting
- **Linear Regression**: Basic trend analysis
- **Polynomial Regression**: Non-linear growth patterns
- **Random Forest**: Complex pattern recognition
- **Ensemble Method**: Combines multiple predictions
- **Confidence Scoring**: Based on model agreement

### Memory Analysis
- **Mann-Kendall Test**: Statistical trend detection
- **Linear Regression**: Growth rate analysis
- **Leak Detection**: Multi-factor probability scoring
- **Volatility Analysis**: Memory usage stability

### CPU Analysis
- **Peak Detection**: Spike identification using scipy
- **Baseline Shift**: Statistical change point detection
- **Pattern Recognition**: Periodic behavior analysis
- **Autocorrelation**: Cyclical pattern detection

### Anomaly Detection
- **Isolation Forest**: Unsupervised anomaly detection
- **Multi-dimensional**: Analyzes all metrics together
- **Scoring**: Provides anomaly confidence scores
- **Temporal Analysis**: Recent anomaly patterns

### Health Trajectory
- **Short-term Trends**: 7-day forecasting
- **Long-term Trends**: 30-day forecasting
- **Critical Prediction**: Time to health threshold
- **Performance Analysis**: Overall system degradation

## Data Requirements

- **Minimum Data Points**: 3 (for basic analysis)
- **Recommended Data Points**: 15+ (for advanced ML)
- **Update Frequency**: Hourly (recommended)
- **Prediction Horizon**: Up to 1 year
- **Required Metrics**: CPU%, RAM%, Storage%
- **Optional Metrics**: Temperature, Network I/O, Disk I/O

## Integration with Node.js Backend

The ML service integrates seamlessly with the Node.js telemetry controller:

1. **Automatic Fallback**: If ML service is unavailable, basic predictions are used
2. **Async Processing**: Non-blocking ML analysis
3. **Error Handling**: Graceful degradation
4. **Real-time Updates**: Predictions update with each telemetry data point

## Performance and Scalability

- **Fast Predictions**: < 100ms for single asset
- **Batch Processing**: Supports multiple assets
- **Memory Efficient**: Optimized data structures
- **Threaded**: Handles concurrent requests
- **Caching**: Model reuse for performance

## Troubleshooting

### Service Won't Start
```bash
# Check Python version (3.7+ required)
python --version

# Install dependencies manually
pip install -r requirements.txt

# Check port availability
netstat -an | grep 5000
```

### Prediction Errors
- Ensure minimum 3 data points
- Check data format (numeric values)
- Verify required fields are present
- Check service logs for details

### Connection Issues
- Verify service is running on port 5000
- Check firewall settings
- Ensure Node.js can reach localhost:5000

## Development

### Adding New Models
1. Extend `AdvancedMLAnalyzer` class
2. Add new analysis method
3. Update `analyze_telemetry()` to call new method
4. Add endpoint if needed

### Testing
```bash
# Test with sample data
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"mac_address":"test","current_data":{"cpu_percent":50,"ram_percent":60,"storage_percent":70},"historical_data":[]}'
```

## Requirements

- Python 3.7+
- Flask 2.3+
- scikit-learn 1.3+
- pandas 2.0+
- numpy 1.24+
- scipy 1.11+

## License

Part of the ITAM (IT Asset Management) system.
