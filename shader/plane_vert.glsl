uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_lightPosition;

attribute vec4 tangent;

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


void main()	{

    //vec4 texel = texture2D(u_tex5, uv);//Pega a textura no vertex shader
    vec3 newVertex = position ; // +texel.r*shadow3*normal

    vNormal = normalize( normalMatrix * normal ); // normal
    vUv = uv;
    vPosition = newVertex; //position

    vec4 vWorldpos = modelMatrix * vec4( position, 1.0 ) ;
    vTangent = normalize( normalMatrix * tangent.xyz );
    vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
    tbn = mat3(vTangent, vBitangent, vNormal);

    /** Calculate the vertex-to-light vector */
    vec4 lightVector = viewMatrix * vec4(u_lightPosition, 1.0);
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    vLightVector = normalize(lightVector.xyz - modelViewPosition.xyz);
    vCameraVector =  normalize(cameraPosition.xyz - modelViewPosition.xyz);
    vViewPosition = - (modelViewMatrix * vec4( position, 1.0 )).xyz;

    
    gl_Position =  projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 ); //position
}