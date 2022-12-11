precision highp float;

#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec3 u_lightPosition;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vTangent;
varying vec3 vBitangent;
varying mat3 tbn;
varying vec3 vLightVector;
varying vec3 vCameraVector;
varying vec3 vViewPosition;

uniform bool enable_cubemap_effect;
uniform samplerCube envMap;
uniform float roughness;
uniform float metalness;
uniform float envMapIntensity;
uniform float flipEnvMap;
uniform int maxMipLevel;

#define PI 3.14159265359

// ############################################################ 
//                        Cubemap Reflection
// ############################################################

float pow2( const in float x ) {
	return x*x;
}
float GGXRoughnessToBlinnExponent( const in float ggxRoughness ) {
	return ( 2.0 / pow2( ggxRoughness + 0.0001 ) - 2.0 );
}
float getSpecularMIPLevel( const in float blinnShininessExponent, const in int maxMIPLevel ) {
	float maxMIPLevelScalar = float( maxMIPLevel );
	float desiredMIPLevel = maxMIPLevelScalar + 0.79248 - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );
	return clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
vec3 getLightProbeIndirectRadiance( const in vec3 viewDir, const in vec3 normal, const in float blinnShininessExponent, const in int maxMIPLevel ) {
	vec3 reflectVec = reflect( -viewDir, normal );
	reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
	float specularMIPLevel = getSpecularMIPLevel( blinnShininessExponent, maxMIPLevel );
	
	vec3 queryReflectVec = vec3( flipEnvMap * -reflectVec.x, reflectVec.yz ); // mirror is opposie [-reflectVec.x]
	vec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );
	envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;
	
	return envMapColor.rgb * envMapIntensity * .75;
}
vec3 getLightProbeIndirectIrradiance( const in vec3 normal, const in int maxMIPLevel ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );
	vec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );
	
	return PI * envMapColor.rgb * envMapIntensity;
}

// 构建了一个环境光反射的效果
vec4 envMapEffect(){
	vec3 irradiance = getLightProbeIndirectIrradiance(normalize(vNormal), maxMipLevel );
	vec3 radiance = getLightProbeIndirectRadiance( normalize( vViewPosition ), normalize(vNormal), GGXRoughnessToBlinnExponent( roughness ), maxMipLevel );

	return vec4( radiance, 1.00 );
}


void main()	{


// 构建了一个环境光反射的效果
	vec4 col = vec4(0.);
	// ## adjust8 - envMap
	vec4 envMap = envMapEffect();
	if(enable_cubemap_effect){
		col = envMap;
	}


 	gl_FragColor = clamp(vec4(col.rgb,col.a), 0.0, 1.0);
}