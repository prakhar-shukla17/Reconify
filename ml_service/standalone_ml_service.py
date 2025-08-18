#!/usr/bin/env python3
"""
Standalone ML Analysis Service for IT Asset Management
Uses only Python built-in libraries - no external dependencies required
"""

import json
import statistics
import math
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

class SimplifiedMLAnalyzer:
    def __init__(self):
        self.min_data_points = 3
        
    def analyze_telemetry(self, mac_address, current_data, historical_data):
        """
        Perform statistical analysis on telemetry data
        """
        try:
            # Prepare data
            all_data = historical_data + [current_data]
            
            if len(all_data) < self.min_data_points:
                return self._generate_basic_predictions(current_data)
            
            # Perform various analyses
            predictions = {}
            
            # Storage analysis
            storage_predictions = self._analyze_storage_trends(all_data)
            predictions.update(storage_predictions)
            
            # Memory analysis
            memory_predictions = self._analyze_memory_patterns(all_data)
            predictions.update(memory_predictions)
            
            # CPU analysis
            cpu_predictions = self._analyze_cpu_patterns(all_data)
            predictions.update(cpu_predictions)
            
            # Health trajectory
            health_predictions = self._analyze_health_trajectory(all_data)
            predictions.update(health_predictions)
            
            # Anomaly detection
            anomaly_analysis = self._detect_simple_anomalies(all_data)
            predictions.update(anomaly_analysis)
            
            # Resource exhaustion timeline
            exhaustion_timeline = self._predict_resource_exhaustion(all_data)
            predictions['resource_exhaustion_timeline'] = exhaustion_timeline
            
            # Performance analysis
            performance_analysis = self._analyze_performance_degradation(all_data)
            predictions.update(performance_analysis)
            
            return predictions
            
        except Exception as e:
            print(f"ML Analysis error: {e}")
            return self._generate_basic_predictions(current_data)
    
    def _analyze_storage_trends(self, data):
        """Storage trend analysis using linear regression"""
        predictions = {}
        
        if len(data) < 5:
            return predictions
        
        try:
            storage_values = [d.get('storage_percent', 0) for d in data]
            
            # Simple linear regression
            slope = self._calculate_simple_slope(storage_values)
            
            # Predict storage full
            current_storage = storage_values[-1]
            if slope > 0.05:  # Growing trend
                hours_to_full = (100 - current_storage) / slope
                if 0 < hours_to_full < 8760:  # Within a year
                    predictions['storage_full_in_days'] = max(1, int(hours_to_full / 24))
                    
                    # Simple confidence based on data consistency
                    variance = statistics.variance(storage_values) if len(storage_values) > 1 else 0
                    confidence = max(0.1, min(0.95, 1 - (variance / 100)))
                    predictions['storage_confidence'] = round(confidence, 2)
        
            # Growth acceleration
            if len(storage_values) >= 7:
                recent_values = storage_values[-7:]
                older_values = storage_values[:-7] if len(storage_values) > 7 else storage_values[:3]
                
                recent_growth = self._calculate_simple_slope(recent_values)
                historical_growth = self._calculate_simple_slope(older_values)
                
                predictions['storage_growth_acceleration'] = round(recent_growth - historical_growth, 2)
            
            # Volatility
            if len(storage_values) >= 3:
                differences = [abs(storage_values[i] - storage_values[i-1]) for i in range(1, len(storage_values))]
                volatility = statistics.mean(differences) if differences else 0
                predictions['storage_volatility'] = round(volatility, 2)
                
        except Exception as e:
            print(f"Storage analysis error: {e}")
        
        return predictions
    
    def _analyze_memory_patterns(self, data):
        """Memory analysis with leak detection"""
        predictions = {}
        
        if len(data) < 5:
            return predictions
        
        try:
            memory_values = [d.get('ram_percent', 0) for d in data]
            
            # Memory leak detection
            if len(memory_values) >= 7:
                slope = self._calculate_simple_slope(memory_values)
                variance = statistics.variance(memory_values) if len(memory_values) > 1 else 0
                
                # Leak probability indicators
                leak_probability = 0
                if slope > 0.5:  # Consistent upward trend
                    leak_probability += 0.4
                if variance < 10 and slope > 0:  # Low variance with growth
                    leak_probability += 0.3
                
                # Check for consistent growth in recent data
                recent_half = memory_values[len(memory_values)//2:]
                older_half = memory_values[:len(memory_values)//2]
                
                if statistics.mean(recent_half) > statistics.mean(older_half) + 5:
                    leak_probability += 0.3
                
                predictions['memory_leak_probability'] = round(min(1.0, leak_probability), 2)
                
                # Time to memory pressure
                if slope > 0:
                    current_memory = memory_values[-1]
                    hours_to_pressure = (90 - current_memory) / slope
                    if 0 < hours_to_pressure < 168:  # Within a week
                        predictions['memory_pressure_in_hours'] = round(hours_to_pressure, 1)
            
            # Memory volatility
            if len(memory_values) >= 3:
                differences = [abs(memory_values[i] - memory_values[i-1]) for i in range(1, len(memory_values))]
                volatility = statistics.mean(differences) if differences else 0
                predictions['memory_volatility'] = round(volatility, 2)
            
            # Memory pressure risk
            current_memory = memory_values[-1]
            if current_memory > 70:
                base_risk = min(1, (current_memory - 70) / 30)
                leak_influence = predictions.get('memory_leak_probability', 0) * 0.3
                predictions['memory_pressure_risk'] = round(min(1.0, base_risk + leak_influence), 2)
                
        except Exception as e:
            print(f"Memory analysis error: {e}")
        
        return predictions
    
    def _analyze_cpu_patterns(self, data):
        """CPU pattern analysis"""
        predictions = {}
        
        if len(data) < 5:
            return predictions
        
        try:
            cpu_values = [d.get('cpu_percent', 0) for d in data]
            
            # CPU spike detection
            cpu_mean = statistics.mean(cpu_values)
            cpu_stdev = statistics.stdev(cpu_values) if len(cpu_values) > 1 else 0
            
            # Count spikes (values > mean + 1.5 * stdev)
            threshold = cpu_mean + 1.5 * cpu_stdev
            spikes = sum(1 for val in cpu_values if val > threshold)
            spike_probability = min(1.0, (spikes / len(cpu_values)) * 3)
            predictions['cpu_spike_probability'] = round(spike_probability, 2)
            
            # Baseline shift detection
            if len(cpu_values) >= 10:
                mid_point = len(cpu_values) // 2
                older_half = cpu_values[:mid_point]
                recent_half = cpu_values[mid_point:]
                
                baseline_shift = statistics.mean(recent_half) - statistics.mean(older_half)
                predictions['cpu_baseline_shift'] = round(baseline_shift, 2)
                    
        except Exception as e:
            print(f"CPU analysis error: {e}")
        
        return predictions
    
    def _analyze_health_trajectory(self, data):
        """Predict system health trajectory"""
        predictions = {}
        
        if len(data) < 7:
            return predictions
        
        try:
            # Calculate health scores
            health_scores = [self._calculate_health_score(d) for d in data]
            
            # Short-term trend (last 7 points)
            if len(health_scores) >= 7:
                recent_scores = health_scores[-7:]
                slope_7d = self._calculate_simple_slope(recent_scores)
                predictions['health_trend_7_days'] = round(slope_7d, 2)
            
            # Long-term trend
            if len(health_scores) >= 15:
                slope_30d = self._calculate_simple_slope(health_scores)
                predictions['health_trend_30_days'] = round(slope_30d, 2)
                
                # Predict critical threshold
                current_health = health_scores[-1]
                if slope_30d < 0 and current_health > 50:
                    days_to_critical = (current_health - 50) / abs(slope_30d)
                    if 0 < days_to_critical < 365:
                        predictions['critical_threshold_days'] = round(days_to_critical, 1)
                        
        except Exception as e:
            print(f"Health trajectory error: {e}")
        
        return predictions
    
    def _detect_simple_anomalies(self, data):
        """Simple anomaly detection using statistical methods"""
        predictions = {}
        
        if len(data) < 5:
            return predictions
        
        try:
            current_data = data[-1]
            
            # Calculate z-scores for each metric
            metrics = ['cpu_percent', 'ram_percent', 'storage_percent']
            anomaly_scores = []
            
            for metric in metrics:
                values = [d.get(metric, 0) for d in data]
                if len(values) > 1:
                    mean_val = statistics.mean(values[:-1])  # Exclude current
                    stdev_val = statistics.stdev(values[:-1]) if len(values) > 2 else 1
                    
                    if stdev_val > 0:
                        z_score = abs((current_data.get(metric, 0) - mean_val) / stdev_val)
                        anomaly_scores.append(z_score)
            
            # Overall anomaly score
            if anomaly_scores:
                avg_z_score = statistics.mean(anomaly_scores)
                predictions['anomaly_score'] = round(avg_z_score, 3)
                predictions['is_anomaly'] = avg_z_score > 2.0  # 2 standard deviations
                
                # Count recent anomalies
                recent_anomaly_count = 0
                for i in range(max(0, len(data) - 10), len(data)):
                    point_scores = []
                    for metric in metrics:
                        values = [d.get(metric, 0) for d in data[:i+1]]
                        if len(values) > 2:
                            mean_val = statistics.mean(values[:-1])
                            stdev_val = statistics.stdev(values[:-1])
                            if stdev_val > 0:
                                z_score = abs((values[-1] - mean_val) / stdev_val)
                                point_scores.append(z_score)
                    
                    if point_scores and statistics.mean(point_scores) > 2.0:
                        recent_anomaly_count += 1
                
                predictions['recent_anomaly_count'] = recent_anomaly_count
                
        except Exception as e:
            print(f"Anomaly detection error: {e}")
        
        return predictions
    
    def _predict_resource_exhaustion(self, data):
        """Predict resource exhaustion timeline"""
        timeline = {}
        
        if len(data) < 5:
            return timeline
        
        current_data = data[-1]
        
        try:
            # CPU exhaustion
            if current_data.get('cpu_percent', 0) > 80:
                cpu_values = [d.get('cpu_percent', 0) for d in data]
                slope = self._calculate_simple_slope(cpu_values)
                
                if slope > 0:
                    hours_to_95 = (95 - current_data.get('cpu_percent', 0)) / slope
                    if 0 < hours_to_95 < 168:  # Within a week
                        timeline['cpu_critical_hours'] = round(hours_to_95, 1)
            
            # Memory exhaustion
            if current_data.get('ram_percent', 0) > 80:
                memory_values = [d.get('ram_percent', 0) for d in data]
                slope = self._calculate_simple_slope(memory_values)
                
                if slope > 0:
                    hours_to_95 = (95 - current_data.get('ram_percent', 0)) / slope
                    if 0 < hours_to_95 < 168:  # Within a week
                        timeline['memory_critical_hours'] = round(hours_to_95, 1)
            
            # Storage exhaustion
            if current_data.get('storage_percent', 0) > 85:
                storage_values = [d.get('storage_percent', 0) for d in data]
                slope = self._calculate_simple_slope(storage_values)
                
                if slope > 0:
                    hours_to_98 = (98 - current_data.get('storage_percent', 0)) / slope
                    if 0 < hours_to_98 < 8760:  # Within a year
                        timeline['storage_critical_days'] = round(hours_to_98 / 24, 1)
                        
        except Exception as e:
            print(f"Resource exhaustion prediction error: {e}")
        
        return timeline
    
    def _analyze_performance_degradation(self, data):
        """Analyze performance degradation"""
        predictions = {}
        
        if len(data) < 5:
            return predictions
        
        try:
            # Calculate performance scores
            performance_scores = []
            for d in data:
                score = 100 - (
                    d.get('cpu_percent', 0) * 0.4 + 
                    d.get('ram_percent', 0) * 0.4 + 
                    d.get('storage_percent', 0) * 0.2
                )
                performance_scores.append(score)
            
            # Current performance risk
            current_perf = performance_scores[-1]
            if current_perf < 70:
                predictions['performance_degradation_risk'] = round((70 - current_perf) / 70, 2)
            else:
                predictions['performance_degradation_risk'] = 0.0
            
            # Performance trend
            if len(performance_scores) >= 5:
                slope = self._calculate_simple_slope(performance_scores)
                predictions['performance_trend'] = round(slope, 2)
                
        except Exception as e:
            print(f"Performance analysis error: {e}")
        
        return predictions
    
    def _calculate_simple_slope(self, values):
        """Calculate slope using simple linear regression"""
        if len(values) < 2:
            return 0
        
        n = len(values)
        x_values = list(range(n))
        
        x_mean = statistics.mean(x_values)
        y_mean = statistics.mean(values)
        
        numerator = sum((x_values[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
        
        return numerator / denominator if denominator != 0 else 0
    
    def _calculate_health_score(self, data_point):
        """Calculate health score for a single data point"""
        score = 100
        
        # CPU health (30% weight)
        cpu_percent = data_point.get('cpu_percent', 0)
        if cpu_percent > 90:
            score -= 25
        elif cpu_percent > 80:
            score -= 15
        elif cpu_percent > 70:
            score -= 8
        
        # Memory health (30% weight)
        ram_percent = data_point.get('ram_percent', 0)
        if ram_percent > 95:
            score -= 25
        elif ram_percent > 85:
            score -= 15
        elif ram_percent > 75:
            score -= 8
        
        # Storage health (25% weight)
        storage_percent = data_point.get('storage_percent', 0)
        if storage_percent > 95:
            score -= 20
        elif storage_percent > 90:
            score -= 12
        elif storage_percent > 85:
            score -= 6
        
        # Temperature health (15% weight)
        temperature = data_point.get('temperature')
        if temperature:
            if temperature > 85:
                score -= 15
            elif temperature > 75:
                score -= 8
            elif temperature > 65:
                score -= 3
        
        return max(0, min(100, score))
    
    def _generate_basic_predictions(self, current_data):
        """Generate basic predictions when insufficient data"""
        predictions = {}
        
        # Basic assessments
        storage_percent = current_data.get('storage_percent', 0)
        if storage_percent > 90:
            predictions['storage_full_in_days'] = max(1, int((100 - storage_percent) / 0.5))
            predictions['storage_confidence'] = 0.3
        
        ram_percent = current_data.get('ram_percent', 0)
        if ram_percent > 85:
            predictions['memory_pressure_risk'] = min(1.0, (ram_percent - 70) / 30)
        
        cpu_percent = current_data.get('cpu_percent', 0)
        if cpu_percent > 80:
            predictions['cpu_spike_probability'] = 0.6
        
        # Performance degradation risk
        perf_score = 100 - (cpu_percent * 0.4 + ram_percent * 0.4 + storage_percent * 0.2)
        predictions['performance_degradation_risk'] = max(0, min(1.0, (70 - perf_score) / 70))
        
        return predictions


class MLRequestHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ml_analyzer = SimplifiedMLAnalyzer()
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self._send_json_response({
                'status': 'healthy',
                'service': 'ML Analysis Service',
                'analyzer_type': 'Standalone Statistical',
                'version': '1.0.0',
                'dependencies': 'Python built-in libraries only'
            })
        elif parsed_path.path == '/model_info':
            self._send_json_response({
                'models': {
                    'storage_prediction': 'Linear Regression (built-in)',
                    'memory_analysis': 'Statistical Analysis',
                    'cpu_analysis': 'Statistical Pattern Detection',
                    'health_trajectory': 'Trend Analysis',
                    'anomaly_detection': 'Z-Score Analysis'
                },
                'features': [
                    'Storage growth prediction',
                    'Memory leak detection',
                    'CPU spike probability',
                    'Health trajectory forecasting',
                    'Resource exhaustion timeline',
                    'Performance degradation analysis'
                ],
                'requirements': {
                    'minimum_data_points': 3,
                    'dependencies': 'None (Python built-in only)'
                }
            })
        else:
            self._send_error_response(404, 'Endpoint not found')
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/predict':
            try:
                # Read request body
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                # Parse JSON
                try:
                    data = json.loads(post_data.decode('utf-8'))
                except json.JSONDecodeError:
                    self._send_error_response(400, 'Invalid JSON data')
                    return
                
                # Validate required fields
                required_fields = ['mac_address', 'current_data', 'historical_data']
                for field in required_fields:
                    if field not in data:
                        self._send_error_response(400, f'Missing required field: {field}')
                        return
                
                # Validate current_data has required metrics
                required_metrics = ['cpu_percent', 'ram_percent', 'storage_percent']
                for metric in required_metrics:
                    if metric not in data['current_data']:
                        self._send_error_response(400, f'Missing metric in current_data: {metric}')
                        return
                
                # Perform ML analysis
                predictions = self.ml_analyzer.analyze_telemetry(
                    mac_address=data['mac_address'],
                    current_data=data['current_data'],
                    historical_data=data['historical_data']
                )
                
                self._send_json_response(predictions)
                
            except Exception as e:
                print(f"Prediction error: {e}")
                self._send_error_response(500, f'Internal server error: {str(e)}')
        else:
            self._send_error_response(404, 'Endpoint not found')
    
    def _send_json_response(self, data, status_code=200):
        """Send JSON response with CORS headers"""
        response_data = json.dumps(data, indent=2)
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        self.wfile.write(response_data.encode('utf-8'))
    
    def _send_error_response(self, status_code, message):
        """Send error response"""
        error_data = {'error': message}
        self._send_json_response(error_data, status_code)
    
    def log_message(self, format, *args):
        """Custom log message format"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")


def run_server(port=5000):
    """Run the ML service server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MLRequestHandler)
    
    print("🧠 Standalone ML Analysis Service")
    print("=" * 50)
    print("🔬 Statistical predictions for IT assets")
    print("📊 Features: Storage forecasting, Memory leak detection, CPU analysis")
    print("🚀 No external dependencies required!")
    print(f"🌐 Server running on http://localhost:{port}")
    print("\n📡 Available endpoints:")
    print("   • GET  /health - Health check")
    print("   • GET  /model_info - Model information") 
    print("   • POST /predict - Main prediction endpoint")
    print("\n🔄 Ready to receive requests from Node.js backend")
    print("=" * 50)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ML service...")
        httpd.shutdown()


if __name__ == '__main__':
    run_server()
