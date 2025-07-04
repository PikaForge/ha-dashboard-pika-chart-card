# Debugging Guide

## Current Issues

### Data Display Problem
- Chart.js shows "0 and invalid date"
- D3 shows nothing

### Fixed Issues
- ✅ Removed library dropdown selector
- ✅ Added time scale configuration to Chart.js adapter
- ✅ Added debug logging to understand data flow

## Debug Steps

1. **Check Browser Console**
   - Open Home Assistant dashboard
   - Open browser developer tools (F12)
   - Check console for errors
   - Look for log messages starting with:
     - `History response for`
     - `Processing history data for entity:`
     - `State:`, `Parsed value:`, `Date:`, `Point:`

2. **Test Configuration**
   ```yaml
   type: custom:pika-chart-card
   title: Test Chart
   entities:
     - entity: sensor.temperature  # Replace with your actual entity
       name: Temperature
       color: '#ff6384'
   hours_to_show: 24
   chart_type: line
   library: chartjs
   ```

3. **Common Entity Types to Test**
   - Temperature sensors: `sensor.temperature`
   - Humidity sensors: `sensor.humidity`
   - Power sensors: `sensor.power`
   - Any numeric sensor that changes over time

4. **Check Entity State**
   - Go to Developer Tools > States in Home Assistant
   - Find your entity
   - Verify it has numeric values
   - Check `unit_of_measurement` attribute

5. **Expected Data Format**
   The history API should return data like:
   ```json
   {
     "sensor.temperature": [
       {
         "state": "21.5",
         "attributes": {...},
         "last_changed": "2025-01-04T10:00:00.000Z",
         "last_updated": "2025-01-04T10:00:00.000Z"
       }
     ]
   }
   ```

## Troubleshooting Tips

1. **Entity Not Found**
   - Check entity ID spelling
   - Ensure entity exists in Home Assistant
   - Try with a different entity

2. **No Data Points**
   - Increase `hours_to_show`
   - Check if entity has history enabled
   - Verify recorder is running

3. **Invalid Dates**
   - Check timezone settings
   - Verify `last_changed` format in logs
   - Ensure dates are ISO 8601 format

## Next Steps

Based on console logs, we can:
1. Adjust date parsing if needed
2. Fix value parsing for specific entity types
3. Add more robust error handling