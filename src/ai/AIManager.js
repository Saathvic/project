export class AIManager {
  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama3-8b-8192';
    this.cache = new Map();
    this.lastAnalysis = null;
    this.isConnected = false;
    this.requestCount = 0;
    this.lastRequestTime = null;
    
    // Initialize connection
    this.initializeConnection();
  }

  async initializeConnection() {
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.warn('Groq API key not found. AI features will use fallback analysis.');
      this.updateUIStatus('🔴 No API Key', 'Not configured');
      return;
    }

    try {
      // Test connection with a simple request
      await this.testConnection();
      this.isConnected = true;
      this.updateUIStatus('🟢 Connected', 'Configured');
      console.log('Groq AI successfully connected');
    } catch (error) {
      console.error('Failed to connect to Groq AI:', error);
      this.updateUIStatus('🔴 Connection Failed', 'Error');
    }
  }

  async testConnection() {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a test. Respond with "OK" only.'
          },
          {
            role: 'user',
            content: 'Test connection'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  updateUIStatus(status, keyStatus) {
    // Update UI elements if they exist
    const groqStatus = document.getElementById('groqStatus');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const requestCount = document.getElementById('requestCount');
    const lastRequest = document.getElementById('lastRequest');

    if (groqStatus) groqStatus.textContent = status;
    if (apiKeyStatus) apiKeyStatus.textContent = keyStatus;
    if (requestCount) requestCount.textContent = this.requestCount.toString();
    if (lastRequest) {
      lastRequest.textContent = this.lastRequestTime 
        ? new Date(this.lastRequestTime).toLocaleTimeString()
        : 'Never';
    }
  }

  async analyzeCrop(crop) {
    const cacheKey = this.getCacheKey(crop);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let analysis;
      if (this.isConnected && this.apiKey && this.apiKey !== 'undefined') {
        analysis = await this.performAIAnalysis(crop);
        this.requestCount++;
        this.lastRequestTime = Date.now();
        this.updateUIStatus('🟢 Connected', 'Active');
      } else {
        analysis = this.getFallbackAnalysis(crop);
      }
      
      this.cache.set(cacheKey, analysis);
      this.updateUIStatus();
      return analysis;
    } catch (error) {
      console.error('AI Analysis failed:', error);
      this.updateUIStatus('🔴 Request Failed', 'Error');
      return this.getFallbackAnalysis(crop);
    }
  }

  async performAIAnalysis(crop) {
    const prompt = this.buildAnalysisPrompt(crop);
    
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural AI assistant specializing in crop analysis and farming optimization. Provide detailed, scientific, and actionable advice. Keep responses concise but comprehensive.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseAIResponse(data.choices[0].message.content, crop);
  }

  buildAnalysisPrompt(crop) {
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    
    return `Analyze this ${crop.type} plant with the following conditions:
    
Plant Status:
- Growth: ${Math.floor(crop.growth)}%
- Health: ${Math.floor(crop.health)}%
- Water Level: ${Math.floor(crop.waterLevel)}%
- Soil Moisture: ${Math.floor(crop.soilMoisture)}%
- Nutrient Level: ${Math.floor(crop.nutrientLevel)}%
- Disease Level: ${Math.floor(crop.diseaseLevel)}%
- Days since planted: ${Math.floor(daysSincePlanted)}
- Expected maturity: ${crop.cropInfo.growthTime} days
- Water requirement: ${crop.cropInfo.waterNeed}
- Environmental stress: ${Math.floor(crop.environmentalStress * 100)}%

Please provide:
1. Current plant condition assessment
2. Most urgent action needed
3. Growth optimization recommendations
4. Disease/pest management advice
5. Predicted yield and quality
6. Timeline for next actions

Keep responses concise but detailed, focusing on actionable farming advice.`;
  }

  parseAIResponse(response, crop) {
    // Parse the AI response and structure it
    const sections = response.split('\n').filter(line => line.trim());
    
    return {
      condition: this.extractSection(sections, ['condition', 'assessment', 'status']) || this.assessCondition(crop),
      urgentAction: this.extractSection(sections, ['urgent', 'immediate', 'priority']) || this.getUrgentAction(crop),
      recommendations: this.extractSection(sections, ['recommend', 'optimization', 'improve']) || this.getRecommendations(crop),
      diseaseManagement: this.extractSection(sections, ['disease', 'pest', 'treatment']) || this.getDiseaseAdvice(crop),
      yieldPrediction: this.extractSection(sections, ['yield', 'harvest', 'production']) || this.predictYield(crop),
      timeline: this.extractSection(sections, ['timeline', 'schedule', 'next']) || this.getTimeline(crop),
      confidence: this.calculateConfidence(crop),
      timestamp: Date.now()
    };
  }

  extractSection(sections, keywords) {
    for (const section of sections) {
      for (const keyword of keywords) {
        if (section.toLowerCase().includes(keyword)) {
          return section.replace(/^\d+\.\s*/, '').trim();
        }
      }
    }
    return null;
  }

  calculateConfidence(crop) {
    // Calculate AI confidence based on data quality
    const dataQuality = (
      (crop.health > 0 ? 1 : 0) +
      (crop.waterLevel >= 0 ? 1 : 0) +
      (crop.nutrientLevel >= 0 ? 1 : 0) +
      (crop.growth >= 0 ? 1 : 0)
    ) / 4;
    
    return Math.floor(dataQuality * (this.isConnected ? 95 : 85));
  }

  getFallbackAnalysis(crop) {
    // Provide intelligent fallback analysis when AI is unavailable
    const analysis = {
      condition: this.assessCondition(crop),
      urgentAction: this.getUrgentAction(crop),
      recommendations: this.getRecommendations(crop),
      diseaseManagement: this.getDiseaseAdvice(crop),
      yieldPrediction: this.predictYield(crop),
      timeline: this.getTimeline(crop),
      confidence: 85,
      timestamp: Date.now()
    };
    
    return analysis;
  }

  assessCondition(crop) {
    const avgHealth = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgHealth >= 90) return "Excellent condition - plant is thriving with optimal care and environmental conditions";
    if (avgHealth >= 75) return "Good condition - plant is healthy with minor optimization opportunities available";
    if (avgHealth >= 60) return "Fair condition - requires attention to improve overall health and productivity";
    if (avgHealth >= 40) return "Poor condition - immediate intervention required to prevent further deterioration";
    return "Critical condition - plant survival at risk without urgent comprehensive care";
  }

  getUrgentAction(crop) {
    if (crop.health < 30) return "Apply immediate comprehensive treatment - plant health critically low, risk of plant death";
    if (crop.waterLevel < 20) return "Water immediately with deep irrigation - severe dehydration detected, cellular damage possible";
    if (crop.diseaseLevel > 70) return "Apply targeted fungicide/pesticide treatment - severe disease outbreak threatening plant survival";
    if (crop.growth >= 80 && crop.health >= 30) return "Ready for harvest - optimal timing achieved for maximum yield and quality";
    if (crop.waterLevel < 40) return "Increase watering frequency and depth - moderate dehydration affecting growth rate";
    if (crop.nutrientLevel < 30) return "Apply balanced fertilizer immediately - severe nutrient deficiency limiting growth potential";
    return "Continue current care routine with minor adjustments - plant progressing within normal parameters";
  }

  getRecommendations(crop) {
    const recommendations = [];
    
    if (crop.soilMoisture < 40) {
      recommendations.push("Improve soil water retention with organic mulch layer (2-3 inches)");
    }
    
    if (crop.nutrientLevel < 50) {
      recommendations.push("Apply slow-release fertilizer for sustained nutrition over 6-8 weeks");
    }
    
    if (crop.diseaseLevel > 30) {
      recommendations.push("Improve air circulation and reduce humidity around plant base");
    }
    
    if (crop.growth < 50) {
      recommendations.push("Ensure 6-8 hours direct sunlight exposure for optimal photosynthesis");
    }

    if (crop.environmentalStress > 0.6) {
      recommendations.push("Provide environmental protection during extreme weather conditions");
    }
    
    return recommendations.length > 0 ? recommendations.join('. ') : "Maintain current care practices with regular monitoring";
  }

  getDiseaseAdvice(crop) {
    if (crop.diseaseLevel > 50) {
      return "High disease pressure detected. Apply organic neem oil or copper-based fungicide every 7-10 days. Improve drainage and air circulation. Remove affected plant material immediately.";
    } else if (crop.diseaseLevel > 25) {
      return "Moderate disease risk present. Monitor closely for symptoms and consider preventive treatments. Remove affected leaves if visible. Ensure proper plant spacing.";
    }
    return "Low disease risk maintained. Continue preventive care with proper spacing, watering practices, and regular inspection for early detection.";
  }

  predictYield(crop) {
    const qualityFactor = (crop.health + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 300;
    const growthFactor = Math.min(crop.growth / 100, 1);
    const environmentalFactor = 1 - (crop.environmentalStress * 0.3);
    
    const baseYield = crop.cropInfo.harvestYield;
    const totalQuality = qualityFactor * environmentalFactor;
    const qualityRating = totalQuality > 0.8 ? "Premium" : totalQuality > 0.6 ? "Good" : totalQuality > 0.4 ? "Fair" : "Poor";
    
    return `Expected yield: ${baseYield} at ${qualityRating} quality (${Math.floor(totalQuality * 100)}% of optimal potential)`;
  }

  getTimeline(crop) {
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - daysSincePlanted);
    
    if (crop.growth >= 80) {
      return "Harvest within 1-3 days for optimal quality and maximum yield potential";
    } else if (daysToMaturity <= 7) {
      return `Approaching maturity in ${Math.floor(daysToMaturity)} days. Prepare harvest equipment and storage.`;
    } else if (daysToMaturity <= 14) {
      return `${Math.floor(daysToMaturity)} days to maturity. Focus on consistent care and monitoring.`;
    }
    return `${Math.floor(daysToMaturity)} days to maturity. Establish strong growth foundation with optimal nutrition.`;
  }

  getCacheKey(crop) {
    // Create a cache key based on crop state
    return `${crop.type}_${Math.floor(crop.growth/10)}_${Math.floor(crop.health/10)}_${Math.floor(crop.waterLevel/10)}_${Math.floor(crop.diseaseLevel/10)}`;
  }

  async generateCropVariation(cropType, environmentalFactors) {
    // Generate AI-powered crop variations
    if (!this.isConnected) {
      return this.getFallbackVariation();
    }

    try {
      const prompt = `Generate realistic variations for ${cropType} plants considering:
      - Soil quality: ${environmentalFactors.soilQuality}
      - Weather conditions: ${environmentalFactors.weather}
      - Season: ${environmentalFactors.season}
      
      Provide JSON with: height_variation, color_variation, leaf_count, growth_rate_modifier, disease_resistance`;

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an agricultural genetics AI. Respond only with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.8
        })
      });

      if (response.ok) {
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('Crop variation generation failed:', error);
    }

    return this.getFallbackVariation();
  }

  getFallbackVariation() {
    return {
      height_variation: 0.8 + Math.random() * 0.4,
      color_variation: Math.random() * 0.3,
      leaf_count: 0.7 + Math.random() * 0.6,
      growth_rate_modifier: 0.8 + Math.random() * 0.4,
      disease_resistance: Math.random()
    };
  }

  async predictWeatherImpact(weatherData, crops) {
    if (!this.isConnected) {
      return this.getFallbackWeatherAnalysis(weatherData, crops);
    }

    const prompt = `Analyze weather impact on crops:
    Weather: Temperature ${weatherData.temperature}°C, Humidity ${weatherData.humidity}%, Wind ${weatherData.windSpeed}km/h
    Crops: ${crops.map(c => `${c.type} (${Math.floor(c.growth)}% grown)`).join(', ')}
    
    Predict: growth_impact, disease_risk, water_needs, recommended_actions`;

    try {
      const response = await this.performAIRequest(prompt, 'weather analysis');
      return this.parseWeatherResponse(response);
    } catch (error) {
      return this.getFallbackWeatherAnalysis(weatherData, crops);
    }
  }

  parseWeatherResponse(response) {
    return {
      growthImpact: this.extractValue(response, 'growth'),
      diseaseRisk: this.extractValue(response, 'disease'),
      waterNeeds: this.extractValue(response, 'water'),
      recommendations: this.extractValue(response, 'recommend')
    };
  }

  getFallbackWeatherAnalysis(weatherData, crops) {
    return {
      growthImpact: weatherData.temperature > 25 ? 'Accelerated' : 'Normal',
      diseaseRisk: weatherData.humidity > 70 ? 'High' : 'Low',
      waterNeeds: weatherData.temperature > 25 ? 'Increased' : 'Normal',
      recommendations: 'Monitor plants closely for weather-related stress and adjust care accordingly'
    };
  }

  extractValue(text, keyword) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        return line.split(':')[1]?.trim() || 'Analysis pending';
      }
    }
    return 'Data not available';
  }

  // Public method for UI to test connection
  async testConnectionFromUI() {
    try {
      await this.testConnection();
      this.isConnected = true;
      this.updateUIStatus('🟢 Connection Successful', 'Active');
      return true;
    } catch (error) {
      this.isConnected = false;
      this.updateUIStatus('🔴 Connection Failed', 'Error');
      throw error;
    }
  }

  // Clear cache method for UI
  clearCache() {
    this.cache.clear();
    console.log('AI analysis cache cleared');
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasApiKey: !!(this.apiKey && this.apiKey !== 'undefined'),
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      model: this.model
    };
  }
}