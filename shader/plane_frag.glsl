precision highp float;

#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec3 u_lightPosition;
uniform float u_lightRadius;


// 控件矩阵
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

// Vertex 信息
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

// 材质 信息
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;
uniform sampler2D u_tex4;
uniform sampler2D u_tex5;
uniform sampler2D u_tex6;
uniform sampler2D u_tex7;
uniform sampler2D u_tex8;


// 环境光 信息（未使用）
uniform bool enable_cubemap_effect;
uniform samplerCube envMap;
uniform float roughness;
uniform float metalness;
uniform float envMapIntensity;
uniform float flipEnvMap;
uniform int maxMipLevel;

// 色彩 信息
uniform float color_tempture_strength_day;
uniform float color_tempture_strength_night;
uniform float color_tempture_scale;
uniform float color_tempture_strength;
uniform float color_hue;
uniform float color_brightness;
uniform float color_saturation;
uniform float color_gamma;

// 光影 信息
uniform vec3 light_day_color;
uniform vec3 light_night_color;
uniform float light_luminance;
uniform float grid_specular_strength;
uniform float icon_specular_strength;
uniform float shadow_range;
uniform float shadow_radius;
uniform float shadow_long_radius;
uniform float shadow_long_length;
uniform float shadow_long_strength;
uniform float shadow_long_feather;
uniform float shadow_short_radius;
uniform float shadow_short_length;
uniform float shadow_short_strength;
uniform float shadow_short_feather;
uniform float shadow_mix;

//Shader Toy Basic Uniform

#define PI 3.14159265359
#define iTime u_time
#define iResolution u_resolution
#define iMouse u_mouse

// Texture
#define bgTexture u_tex0
#define gridTexture u_tex1
#define gridNormalTexture u_tex2
#define iconTexture u_tex3
#define iconNormalTexture u_tex4
#define sdfTexture u_tex5
#define cubeMapReflectionTexture u_tex6
#define colorTemptureTexture u_tex7
#define daynightColorTemptureTexture u_tex8

// 混合模式
#define BlendLinearDodgef               BlendAddf
#define BlendLinearBurnf                BlendSubstractf
#define BlendAddf(base, blend)          min(base + blend, 1.0)
#define BlendSubstractf(base, blend)    max(base + blend - 1.0, 0.0)
#define BlendLightenf(base, blend)      max(blend, base)
#define BlendDarkenf(base, blend)       min(blend, base)
#define BlendLinearLightf(base, blend)  (blend < 0.5 ? BlendLinearBurnf(base, (2.0 * blend)) : BlendLinearDodgef(base, (2.0 * (blend - 0.5))))
#define BlendScreenf(base, blend)       (1.0 - ((1.0 - base) * (1.0 - blend)))
#define BlendOverlayf(base, blend)      (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))
#define BlendSoftLightf(base, blend)    ((blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend)))
#define BlendColorDodgef(base, blend)   ((blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0))
#define BlendColorBurnf(base, blend)    ((blend == 0.0) ? blend : max((1.0 - ((1.0 - base) / blend)), 0.0))
#define BlendVividLightf(base, blend)   ((blend < 0.5) ? BlendColorBurnf(base, (2.0 * blend)) : BlendColorDodgef(base, (2.0 * (blend - 0.5))))
#define BlendPinLightf(base, blend)     ((blend < 0.5) ? BlendDarkenf(base, (2.0 * blend)) : BlendLightenf(base, (2.0 *(blend - 0.5))))
#define BlendHardMixf(base, blend)      ((BlendVividLightf(base, blend) < 0.5) ? 0.0 : 1.0)
#define BlendReflectf(base, blend)      ((blend == 1.0) ? blend : min(base * base / (1.0 - blend), 1.0))

#define Blend(base, blend, funcf)       vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))

#define BlendNormal(base, blend)        (blend)
#define BlendLighten                    BlendLightenf
#define BlendDarken                     BlendDarkenf
#define BlendMultiply(base, blend)      (base * blend)
#define BlendAverage(base, blend)       ((base + blend) / 2.0)
#define BlendAdd(base, blend)           min(base + blend, vec3(1.0))
#define BlendSubstract(base, blend)     max(base + blend - vec3(1.0), vec3(0.0))
#define BlendDifference(base, blend)    abs(base - blend)
#define BlendNegation(base, blend)      (vec3(1.0) - abs(vec3(1.0) - base - blend))
#define BlendExclusion(base, blend)     (base + blend - 2.0 * base * blend)
#define BlendScreen(base, blend)        Blend(base, blend, BlendScreenf)
#define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)
#define BlendSoftLight(base, blend)     Blend(base, blend, BlendSoftLightf)
#define BlendHardLight(base, blend)     BlendOverlay(blend, base)
#define BlendColorDodge(base, blend)    Blend(base, blend, BlendColorDodgef)
#define BlendColorBurn(base, blend)     Blend(base, blend, BlendColorBurnf)
#define BlendLinearDodge                BlendAdd
#define BlendLinearBurn                 BlendSubstract

#define BlendLinearLight(base, blend)   Blend(base, blend, BlendLinearLightf)
#define BlendVividLight(base, blend)    Blend(base, blend, BlendVividLightf)
#define BlendPinLight(base, blend)      Blend(base, blend, BlendPinLightf)
#define BlendHardMix(base, blend)       Blend(base, blend, BlendHardMixf)
#define BlendReflect(base, blend)       Blend(base, blend, BlendReflectf)
#define BlendGlow(base, blend)          BlendReflect(blend, base)
#define BlendPhoenix(base, blend)       (min(base, blend) - max(base, blend) + vec3(1.0))
#define BlendOpacity(base, blend, F, O) (F(base, blend) * O + blend * (1.0 - O))


// ############################################################ 
//                        Cubemap Reflection（未使用）
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

vec4 envMapEffect(){
	vec3 irradiance = getLightProbeIndirectIrradiance(normalize(vNormal), maxMipLevel );
	vec3 radiance = getLightProbeIndirectRadiance( normalize( vViewPosition ), normalize(vNormal), GGXRoughnessToBlinnExponent( roughness ), maxMipLevel );

	return vec4( radiance, 1.00 );
}




// ############################################################ 
//              SDF Shadow & AO —— 标准长投影（有迭代）、环境光遮蔽
// ############################################################


float fillMask(float dist)
{
	return clamp(-dist, 0.0, 1.0);
}

vec3 translate(vec3 p, vec3 t)
{
	return p - t;
}


float circleDist(vec3 p, float radius)
{
	return length(p) - radius;
}
float easeOutCubic(float t) {
    return (t = t - 1.0) * t * t + 1.;
}

float easeOutQuint(float t) {
	return 1. - pow(1. - t, 5.);
}

float easeOutCirc(float x){
	return sqrt(1. - pow(x - 1., 2.));
}

float easeInQuint(float x) {
    return x * x * x * x * x;
}


float sceneDist(in sampler2D sdfTex,vec3 p,float blockSize,float shadowStrength)
{
    vec4 sdfColor = texture2D(sdfTex,vec2(p.x/(gl_FragCoord.x/vUv.x),p.y/(gl_FragCoord.y/vUv.y)));
    float sdfDistance = (blockSize - sdfColor.r)*shadowStrength;
	//float c = circleDist(translate(p, vec3((gl_FragCoord.x/vUv.x)/2., (gl_FragCoord.y/vUv.y)/2.,0.)), 100.0);

	return sdfDistance;
}


float sceneSmooth(in sampler2D sdfTex,vec3 p, float r)
{
	float accum = sceneDist(sdfTex,p,0.35,1.);
	accum += sceneDist(sdfTex,p + vec3(0.0, r,0.),0.35,1.);
	accum += sceneDist(sdfTex,p + vec3(0.0, -r,0.),0.35,1.);
	accum += sceneDist(sdfTex,p + vec3(r, 0.0,0.),0.35,1.);
	accum += sceneDist(sdfTex,p + vec3(-r, 0.0,0.),0.35,1.);
    accum += sceneDist(sdfTex,p + vec3(0., 0.0,r),0.35,1.);
	accum += sceneDist(sdfTex,p + vec3(0., 0.0,-r),0.35,1.);
	return accum / 15.0;
}

float AO( float dist, float radius, float intensity)
{
	float a = clamp(dist / radius, 0.0, 1.0) - 1.0;
	return 1.0 - (pow(abs(a), 5.0) + 1.0) * intensity + (1.0 - intensity);
	return smoothstep(0.0, 1.0, dist / radius);
}



float shadow(in sampler2D sdfTex,vec3 pos, vec3 lightPos, float radius,bool isLongShadow)
{
	vec3 dir = normalize(lightPos - pos); //rd
	float dl = length(pos - lightPos); //ro
	float lf = radius * dl;
	
	// distance traveled
	float dt = 0.01;


	float lightPosZ = max(0.,lightPos.z/u_lightRadius);
    if(isLongShadow){
        for (float i = 0.; i < 10.; ++i)
		{				
	
            // distance to scene at current position
            float sd = sceneDist(sdfTex,pos + dir * dt,shadow_long_radius,shadow_long_length*lightPosZ);;

            // early out when this ray is guaranteed to be full shadow
            if (sd < -radius) 
                return 0.0;

            // width of cone-overlap at light
            // 0 in center, so 50% overlap: add one radius outside of loop to get total coverage
            // should be '(sd / dt) * dl', but '*dl' outside of loop
            lf = min(lf, sd / dt)*shadow_long_strength;

            // move ahead
            dt += max(2.0*pow(float(i)/40.0,shadow_long_feather), abs(sd)); //*easeOutQuint(float(i)/40.)


			//dt *= easeOutQuint(float(i)/40.);
			
            if (dt > dl) break;
		}
    }else{
        for (float i = 0.; i < 10.; ++i)
		{				
            // distance to scene at current position
            float sd = sceneDist(sdfTex,pos + dir * dt,shadow_short_radius,shadow_short_length*abs(lightPos.z/u_lightRadius));

            // early out when this ray is guaranteed to be full shadow
            if (sd < -radius) 
                return 0.0;

            // width of cone-overlap at light
            // 0 in center, so 50% overlap: add one radius outside of loop to get total coverage
            // should be '(sd / dt) * dl', but '*dl' outside of loop
            lf = min(lf, sd / dt)*shadow_short_strength;

            // move ahead
            dt += max(2.0, abs(sd));
            if (dt > dl) break;
		}
    }


	// multiply by dl to get the real projected overlap (moved out of loop)
	// add one radius, before between -radius and + radius
	// normalize to 1 ( / 2*radius)
    // ## shadow blur
	lf = clamp((lf*dl + radius) / (4.0 * radius), 0.0, 1.0);

	//lf = smoothstep(0.0, 1.0, lf);
	//lf = (easeOutQuint(lf))*1.;
    return lf;
}


vec4 drawLight(in sampler2D sdfTex,vec3 pos, vec3 lightPos,vec4 lightcolor, float dist, float range, float radius)
{
	float ld = length(pos - lightPos) ;
	
	// out of range
	if (ld > range) return vec4(0.0);
	
	// shadow and falloff
	float shad = shadow(sdfTex,pos, lightPos, radius,false); //false
	shad = mix(shad,shadow(sdfTex,pos, lightPos, radius,true),shadow_mix);
	//shad += shadow(sdfTex,pos, lightPos, radius,true)*1.;
	//shad += addShadow;
	float fall = (range - ld)/range ;
	fall *= fall*1.;
	//float source = fillMask(circleDist(p - pos, radius));
    //source = 0.;
	return (shad * fall) * lightcolor; // shad*fall + source
}
// ############################################################ 
//           SDF Fake Shadow —— 再叠一层贴图阴影（可去掉）
// ############################################################
#define _ShadowSmoothDelta 0.64 //0.64
#define _SmoothDelta 0.63 //0.63
#define _DistanceMark 0.09	//0.09
#define ShadowColor vec4(0.,0.,0.,1.00)


// ## TODO
vec4 sdfFakeDropShadow(in sampler2D sdfTex,in vec2 st,vec4 background){

	// float normalLight;
	// if(u_lightPosition.z < 0.){
	// 	normalLight = -u_lightPosition.z/4000.;
	// }
	// else{
	// 	normalLight = 0.;
	// }


    float shadowDistance = 0.95 - texture2D(sdfTex,st + vec2(0.,0.003)).r; //(1.4 - 0.54*normalLight) -
    float shadowAlpha = smoothstep(_DistanceMark - _ShadowSmoothDelta, _DistanceMark + _ShadowSmoothDelta, shadowDistance);
    //float shadowAlpha = easeOutCubic(shadowDistance);
    vec4 shadowColor = vec4(ShadowColor.rgb,ShadowColor.a*shadowAlpha);
    
    vec4 col = vec4(0.);
    col.a = smoothstep(_DistanceMark - _SmoothDelta, _DistanceMark + _SmoothDelta, shadowDistance);
    col.rgb = background.rgb;
    return mix(shadowColor, col, col.a);

	// //sample distance as normal
    // float d =  texture2D(sdfTexture,st).r + _Offset;

    // //take another sample, _ShadowDist texels up/right from the first
    // float d2 = tex2D(_MainTex, uv+_ShadowDist*_MainTex_TexelSize.xy).r + _Offset;

    // //calculate interpolators (go from 0 to 1 across border)
    // float fill_t = 1-saturate((d-_BorderWidth)/_BorderWidth);
    // float shadow_t = 1-saturate((d2-_ShadowBorderWidth)/_ShadowBorderWidth);

    // //apply the shadow colour, then over the top apply fill colour
    // res = lerp(res,_Border,shadow_t);
    // res = lerp(res,_Fill,fill_t);  
}

// ############################################################ 
//                   Diffuse & Reflection —— 反射折射
// ############################################################


vec4 specularEffect(in vec3 normalTexCol,in vec3 origTexCol,vec3 lightPosition,float specularStrength,vec3 lightColor)
{


	// ###  backup

	// ## 切线法线
	mat3 tsb = mat3( normalize( vTangent ), normalize( vBitangent ), normalize( vNormal ) );
	vec3 normalTex = normalTexCol * 2.0 - 1.0;
	normalTex = ( normalTex );
	vec3 normalVector = normalize(tbn * normalTex);

	// ## 普通法线
	vec3 n = normalTexCol;
	n = normalize(n*2. -1.);

	//normalVector = n;

	vec3 worldPosition = (modelMatrix * vec4( vPosition, 1.0 )).xyz ; // modelViewMatrix
	// vec3 lightVector = vLightVector; // normalize( u_lightPosition -worldPosition);
	// vec3 viewVector = vCameraVector; // normalize(cameraPosition - worldPosition);
	vec3 lightVector = normalize( u_lightPosition -worldPosition);
	vec3 viewVector = normalize(cameraPosition - worldPosition);
	vec3 reflectVector = reflect(-lightVector,normalVector);
	
	vec3 lightVector2 = normalize( vec3(worldPosition.x,worldPosition.y,u_lightPosition.z) -worldPosition);
	vec3 viewVector2 = normalize(vec3(worldPosition.x,worldPosition.y,cameraPosition.z) - worldPosition);
	vec3 reflectVector2 = reflect(-lightVector2,normalVector);
	
	float specular = 0.0;
    float diffuse = max(0.0,dot(lightVector,normalVector));
	if(diffuse > 0.0)
    {
        specular = max(0.0,dot(reflectVector2*1.,viewVector2*1.));
		// TODO Change here
		//specular = max(0.0,dot(reflectVector*1.,viewVector*1.));
    	//specular = pow(specular,16.0);
    }

    float LightIntensity =  1.0 * diffuse + specularStrength * specular; // 1.0 * diffuse + 
	
	vec3 specularColor = lightColor * LightIntensity;
	
	vec3 color = origTexCol * LightIntensity; //origTexCol * specularColor

    return vec4(color, 1.0); //color * intensity   // (brightness*0.3 + LightIntensity*0.7)
}

// ############################################################ 
//      Diffuse & Reflection —— 另外一种反射折射（给背景网格使用）
// ############################################################

vec4 specularEffectAlternative(in vec3 normalTexCol,in vec3 origTexCol,vec3 lightPosition,float specularStrength,vec3 lightColor)
{


	// ###  backup

	// ## 切线法线
	mat3 tsb = mat3( normalize( vTangent ), normalize( vBitangent ), normalize( vNormal ) );
	vec3 normalTex = normalTexCol * 2.0 - 1.0;
	normalTex = ( normalTex );
	vec3 normalVector = normalize(tbn * normalTex);

	// ## 普通法线
	vec3 n = normalTexCol;
	//n = normalize(n*2. -1.);

	//normalVector = n;

	vec3 worldPosition = (modelMatrix * vec4( vPosition, 1.0 )).xyz ; // modelViewMatrix
	vec3 lightVector = normalize( u_lightPosition -worldPosition); //vLightVector;
	vec3 viewVector = normalize(cameraPosition - worldPosition); //vCameraVector;
	vec3 reflectVector = reflect(-lightVector,n);


	float specular = 0.0;
    float diffuse = max(0.0,dot(lightVector,n));
	if(diffuse > 0.0)
    {
        specular = max(0.0,dot(reflectVector*1.,viewVector*1.));
        specular = pow(specular,2.0);
    }

	//specular = max(pow(dot((2.0 * normalVector * dot(normalVector, lightVector)) - lightVector, viewVector), 6.0), 0.0);
    float LightIntensity =  1.0 * diffuse + specularStrength * specular; // 1.0 * diffuse + 

	vec3 specularColor = lightColor * LightIntensity;

	vec3 color = origTexCol * LightIntensity; //origTexCol * specularColor

    return vec4(color, 1.0); //color * intensity   // (brightness*0.3 + LightIntensity*0.7)
}


// ############################################################ 
//                     Color Util —— 调色相关
// ############################################################


vec3 hueShift( vec3 color, float hueAdjust ){

    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

    float   YPrime  = dot (color, kRGBToYPrime);
    float   I       = dot (color, kRGBToI);
    float   Q       = dot (color, kRGBToQ);
    float   hue     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    hue += hueAdjust;

    Q = chroma * sin (hue);
    I = chroma * cos (hue);

    vec3    yIQ   = vec3 (YPrime, I, Q);

    return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );

}

float luminance(vec4 col)
{
	return 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
}


void setLuminance(inout vec4 col, float lum)
{
	lum /= luminance(col);
	col *= lum;
}


vec3 brightnessContrast(in vec3 value, in float brightness,in float contrast)
{
    value = ( value - 0.5 ) * contrast + 0.5 + brightness;

    return value;
}


vec3 czm_saturation(vec3 rgb, float adjustment)
{
	const vec3 W = vec3(0.2125, 0.7154, 0.0721);
	vec3 intensity = vec3(dot(rgb, W));
	return mix(intensity, rgb, adjustment);
}

      
// ############################################################ 
//                 Deprecated —— 未使用
// ############################################################

vec3 shaderBackup(){

	// 反射光
	// ecPosition - 存储传入顶点的眼睛坐标位置
    vec3 ecPosition = vec3(modelViewMatrix * vec4(vPosition,1.0)).xyz;
	// tnorm - 归一化处理表面的法向量
    vec3 tnorm = normalize(normalMatrix * vNormal);
	// lightVec - 眼睛坐标中 物体上的的点 到光源的位置
    vec3 lightVec = normalize(u_lightPosition - ecPosition);
	// reflectVec - 反射矢量
    vec3 reflectVec = reflect(-lightVec,tnorm);
    // viewVec - 查看方向的单位矢量
    vec3 viewVec = normalize(-ecPosition);
	float spec = 0.0;
    // 因为 lightVec 和 tnorm 之前被normalize归一化处理
    // 所以 dot(lightVec,tnorm) 等价于 cos(lightVec,tnorm)，得出漫反射系数
    float diffuse = max(0.0,dot(lightVec,tnorm));
    // 小于90度
    if(diffuse > 0.0)
    {
        // 反射系数 - 计算反射矢量和视野方向角度
        spec = max(0.0,dot(reflectVec,viewVec));
        spec = easeOutCubic(pow(spec,16.0));
    }
    float LightIntensity = 1.0 * diffuse + 0.7 * spec;



	// 环境光
	// Calculate the real position of this pixel in 3d space, taking into account
    // the rotation and scale of the model. It's a useful formula for some effects.
    // This could also be done in the vertex shader
    vec3 worldPosition = ( modelMatrix * vec4( vPosition, 1.0 )).xyz;

    // Calculate the normal including the model rotation and scale
    vec3 worldNormal = normalize( vec3( modelMatrix * vec4( vNormal, 0.0 ) ) );

	vec3 lightVector = normalize( u_lightPosition  - worldPosition );

    // An example simple lighting effect, taking the dot product of the normal
    // (which way this pixel is pointing) and a user generated light position
    float brightness = dot( worldNormal, lightVector );

	return vec3(0.);
}
      

// ############################################################ 
//                      main   
// ############################################################

void main()	{

    vec3 perPixel = vec3(gl_FragCoord.xy,0.) ;
	//vec2 center = (gl_FragCoord.xy/vUv.xy) / 2.0;
	
	//float dist = sceneSmooth(p, 5.0);
	float dist = sceneDist(sdfTexture,vec3(perPixel.x,perPixel.y,0.),0.35,1.);
	
	// ———————————— 添加光颜色 ————————————
	// ## light - day color
    vec4 lightCol = vec4(light_day_color,1.);
    

	// ## light - night color
	if(u_lightPosition.z < 0.){
		lightCol = vec4(light_night_color, 1.0);
	}

    // ## light - luminance
	setLuminance(lightCol, light_luminance + u_lightPosition.z/u_lightRadius*0.25 );
	
	// ———————————— 添加背景图 ————————————
	// ## layer1 - background
	vec4 col;
	col = texture2D(bgTexture,vUv);
	//col = flowEffect(bgTexture,vUv);

	// ———————————— 添加网格图 ————————————
	// ## layer2 - backgroudn grid
	vec4 gridTexture = texture2D(gridTexture,vUv.xy);
	col = mix(col,gridTexture,gridTexture.a);

	// ———————————— 网格的折射反射 ————————————
	// ## layer2(effect) - backgroudn grid specular
	vec4 gridSpecular = specularEffectAlternative(texture2D(gridNormalTexture,vUv.xy).rgb,col.rgb,u_lightPosition,grid_specular_strength,lightCol.rgb);
	col = vec4(BlendLighten(gridSpecular.rgb,col.rgb),col.a);

	//col.rgb = mix(col.rgb,hueShift(col.rgb,3.1415927*(u_lightPosition.z/4000. - 1. + shadow3)),0.5);

	// ———————————— 夜晚色调调节 ————————————
	// ## adjust3 - hue shift
	if(u_lightPosition.z < 0.){
		col.rgb = hueShift(col.rgb,PI*(2. +u_lightPosition.z/u_lightRadius*(0.25/3.)) );
	}
	// ———————————— 全局色调调节 ————————————
	col.rgb = hueShift(col.rgb,PI*(color_hue));

	// ———————————— 环境光遮蔽 ————————————
	// ## adjust4 - icon ambient occlusion
	col *= AO(sceneSmooth(sdfTexture,perPixel, 10.0), 40.0, 0.4);

	// ———————————— 绘制长投影 ————————————
	// ## adjust5 - icon sdf shadow
	col += drawLight(sdfTexture,perPixel, u_lightPosition, lightCol, dist, shadow_range, shadow_radius);

	// ———————————— 绘制一层薄投影 ————————————
	// ## layer6 - icon sdf fake shadow
	col = sdfFakeDropShadow(sdfTexture,vUv.xy,col);

	// ———————————— 绘制图标 ————————————
	// ## layer7 - icon texture
	col = mix(col,texture2D(iconTexture,vUv),texture2D(iconTexture,vUv).a);


	// ———————————— 图标的折射反射 ————————————
	// ## layer9 - icon specular
	vec4 iconSpecular = specularEffect(texture2D(iconNormalTexture,vUv.xy).rgb,texture2D(iconTexture,vUv.xy).rgb,u_lightPosition,icon_specular_strength,lightCol.rgb);

	//iconSpecular = mix(iconSpecular,specularEffect(texture2D(u_tex9,vUv.xy).rgb,texture2D(iconTexture,vUv.xy).rgb,u_lightPosition,icon_specular_strength,lightCol.rgb),0.5);
   	col = vec4(BlendLighten(iconSpecular.rgb,col.rgb),col.a);

	// ———————————— 明度调节 ————————————
	// ## adjust10 - night brightnes
	if(u_lightPosition.z < 0.){
		col.rgb = brightnessContrast(col.rgb,0.+(u_lightPosition.z/u_lightRadius)*0.1,1.);
	}


	// ———————————— 离屏渲染的环境光效果的混合（本案例无关） ————————————
	// ## adjust8 - envMap
	//vec4 envMapCol = texture2D(u_tex6,vUv);//envMapEffect();
	// envMapCol *= 1.;
	if(enable_cubemap_effect){
		vec4 envCol = texture2D(cubeMapReflectionTexture,vUv);
		col = vec4(BlendSoftLight(col.rgb,envCol.rgb),col.a);
	}


	// ———————————— 全局明度和反射 ————————————
	// ## adjus 9 - colorTempture

	col.rgb = brightnessContrast(col.rgb,color_brightness,1.);	

	
	// ———————————— 白天夜晚的色温 ————————————
	if(u_lightPosition.z > 0.){
		float progress = u_lightPosition.z/u_lightRadius;
		vec3 daylightTemptureColor = texture2D(daynightColorTemptureTexture,vec2(0.,progress*0.25)).rgb;
		col.rgb = mix(col.rgb, col.rgb * daylightTemptureColor, color_tempture_strength_day);
	}
	else{
		float progress = -u_lightPosition.z/u_lightRadius;
		vec3 nightlightTemptureColor = texture2D(daynightColorTemptureTexture,vec2(0.,0.5 + progress*0.25)).rgb;
		col.rgb = mix(col.rgb, col.rgb * nightlightTemptureColor, color_tempture_strength_night);
	}


	// ———————————— 全局的色温 ————————————
	vec3 temptureColor = texture2D(colorTemptureTexture,vec2(0.,color_tempture_scale)).rgb;
	col.rgb = mix(col.rgb, col.rgb * temptureColor, color_tempture_strength);


	// ———————————— 全局的饱和度 ————————————
	col.rgb = czm_saturation(col.rgb,color_saturation);


	// ———————————— 全局的Gamma ————————————
	col.rgb = pow( col.rgb, vec3(1.0/color_gamma) );

	//col = envMapCol;
 	gl_FragColor = clamp(vec4(col.rgb,col.a), 0.0, 1.0);
}