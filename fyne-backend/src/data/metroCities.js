'use strict';

const cities = [
  ['mumbai', 'Mumbai', 'Maharashtra'], ['delhi', 'Delhi', 'Delhi'], ['bangalore', 'Bangalore', 'Karnataka'], ['hyderabad', 'Hyderabad', 'Telangana'], ['chennai', 'Chennai', 'Tamil Nadu'],
  ['kolkata', 'Kolkata', 'West Bengal'], ['pune', 'Pune', 'Maharashtra'], ['ahmedabad', 'Ahmedabad', 'Gujarat'], ['surat', 'Surat', 'Gujarat'], ['jaipur', 'Jaipur', 'Rajasthan'],
  ['lucknow', 'Lucknow', 'Uttar Pradesh'], ['kanpur', 'Kanpur', 'Uttar Pradesh'], ['nagpur', 'Nagpur', 'Maharashtra'], ['indore', 'Indore', 'Madhya Pradesh'], ['bhopal', 'Bhopal', 'Madhya Pradesh'],
  ['visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh'], ['patna', 'Patna', 'Bihar'], ['vadodara', 'Vadodara', 'Gujarat'], ['ghaziabad', 'Ghaziabad', 'Uttar Pradesh'], ['ludhiana', 'Ludhiana', 'Punjab'],
  ['agra', 'Agra', 'Uttar Pradesh'], ['nashik', 'Nashik', 'Maharashtra'], ['faridabad', 'Faridabad', 'Haryana'], ['meerut', 'Meerut', 'Uttar Pradesh'], ['rajkot', 'Rajkot', 'Gujarat'],
  ['varanasi', 'Varanasi', 'Uttar Pradesh'], ['srinagar', 'Srinagar', 'Jammu and Kashmir'], ['chhatrapati-sambhajinagar', 'Chhatrapati Sambhajinagar', 'Maharashtra'], ['dhanbad', 'Dhanbad', 'Jharkhand'], ['amritsar', 'Amritsar', 'Punjab'],
  ['prayagraj', 'Prayagraj', 'Uttar Pradesh'], ['ranchi', 'Ranchi', 'Jharkhand'], ['howrah', 'Howrah', 'West Bengal'], ['coimbatore', 'Coimbatore', 'Tamil Nadu'], ['jabalpur', 'Jabalpur', 'Madhya Pradesh'],
  ['gwalior', 'Gwalior', 'Madhya Pradesh'], ['vijayawada', 'Vijayawada', 'Andhra Pradesh'], ['jodhpur', 'Jodhpur', 'Rajasthan'], ['madurai', 'Madurai', 'Tamil Nadu'], ['raipur', 'Raipur', 'Chhattisgarh'],
  ['kota', 'Kota', 'Rajasthan'], ['guwahati', 'Guwahati', 'Assam'], ['chandigarh', 'Chandigarh', 'Chandigarh'], ['thiruvananthapuram', 'Thiruvananthapuram', 'Kerala'], ['solapur', 'Solapur', 'Maharashtra'],
  ['hubballi-dharwad', 'Hubballi-Dharwad', 'Karnataka'], ['mysuru', 'Mysuru', 'Karnataka'], ['tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu'], ['bareilly', 'Bareilly', 'Uttar Pradesh'], ['aligarh', 'Aligarh', 'Uttar Pradesh'],
].map(([slug, city, state]) => ({ slug, city, state }));

module.exports = cities;
