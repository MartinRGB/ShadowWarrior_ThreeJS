
// ############################################################ 
//               Document Ready —— 
// ############################################################

document.addEventListener("DOMContentLoaded", function(event) {
    // 加载 Shader
    shaderOnLoadCallBack(function(){

        let threePromise = new Promise(function(resolve, reject) {
            //初始化 Canvas
            initCanvas()
            //初始化 三维对象 —— 辅助线、平面、模型
            initObject()
            //构建 Render Pass（本案例其实只需要一个 Pass）
            addRenderPass()
            resolve("Success!");
        });

        threePromise.then(function(value) {

            setTimeout(function(){
                //渲染
                requestAnimationFrame(render);
                //鼠标事件
                addMouseEvent();
                
            }, 200);
        }, function(reason) {
            console.log(reason); // Error!
        });



    })
});


// ############################################################ 
//                 Tangent —— 切线计算（没有使用）
// ############################################################
THREE.BufferGeometry.prototype.computeTangents = function () {

    var index = this.index;
    var attributes = this.attributes;

    // based on http://www.terathon.com/code/tangent.html
    // (per vertex tangents)

    if ( index === null ||
         attributes.position === undefined ||
         attributes.normal === undefined ||
         attributes.uv === undefined ) {

        console.warn( 'THREE.BufferGeometry: Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()' );
        return;

    }

    var indices = index.array;
    var positions = attributes.position.array;
    var normals = attributes.normal.array;
    var uvs = attributes.uv.array;

    var nVertices = positions.length / 3;

    if ( attributes.tangent === undefined ) {

        //addAttribute
        this.addAttribute( 'tangent', new THREE.BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

    }

    var tangents = attributes.tangent.array;

    var tan1 = [], tan2 = [];

    for ( var k = 0; k < nVertices; k ++ ) {

        tan1[ k ] = new THREE.Vector3();
        tan2[ k ] = new THREE.Vector3();

    }

    var vA = new THREE.Vector3(),
        vB = new THREE.Vector3(),
        vC = new THREE.Vector3(),

        uvA = new THREE.Vector2(),
        uvB = new THREE.Vector2(),
        uvC = new THREE.Vector2(),

        sdir = new THREE.Vector3(),
        tdir = new THREE.Vector3();

    function handleTriangle( a, b, c ) {

        vA.fromArray( positions, a * 3 );
        vB.fromArray( positions, b * 3 );
        vC.fromArray( positions, c * 3 );

        uvA.fromArray( uvs, a * 2 );
        uvB.fromArray( uvs, b * 2 );
        uvC.fromArray( uvs, c * 2 );

        var x1 = vB.x - vA.x;
        var x2 = vC.x - vA.x;

        var y1 = vB.y - vA.y;
        var y2 = vC.y - vA.y;

        var z1 = vB.z - vA.z;
        var z2 = vC.z - vA.z;

        var s1 = uvB.x - uvA.x;
        var s2 = uvC.x - uvA.x;

        var t1 = uvB.y - uvA.y;
        var t2 = uvC.y - uvA.y;

        var r = 1.0 / ( s1 * t2 - s2 * t1 );

        sdir.set(
            ( t2 * x1 - t1 * x2 ) * r,
            ( t2 * y1 - t1 * y2 ) * r,
            ( t2 * z1 - t1 * z2 ) * r
        );

        tdir.set(
            ( s1 * x2 - s2 * x1 ) * r,
            ( s1 * y2 - s2 * y1 ) * r,
            ( s1 * z2 - s2 * z1 ) * r
        );

        tan1[ a ].add( sdir );
        tan1[ b ].add( sdir );
        tan1[ c ].add( sdir );

        tan2[ a ].add( tdir );
        tan2[ b ].add( tdir );
        tan2[ c ].add( tdir );

    }

    var groups = this.groups;

    if ( groups.length === 0 ) {

        groups = [ {
            start: 0,
            count: indices.length
        } ];

    }

    for ( var j = 0, jl = groups.length; j < jl; ++ j ) {

        var group = groups[ j ];

        var start = group.start;
        var count = group.count;

        for ( var i = start, il = start + count; i < il; i += 3 ) {

            handleTriangle(
                indices[ i + 0 ],
                indices[ i + 1 ],
                indices[ i + 2 ]
            );

        }

    }

    var tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    var n = new THREE.Vector3(), n2 = new THREE.Vector3();
    var w, t, test;

    function handleVertex( v ) {

        n.fromArray( normals, v * 3 );
        n2.copy( n );

        t = tan1[ v ];

        // Gram-Schmidt orthogonalize

        tmp.copy( t );
        tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

        // Calculate handedness

        tmp2.crossVectors( n2, t );
        test = tmp2.dot( tan2[ v ] );
        w = ( test < 0.0 ) ? - 1.0 : 1.0;

        tangents[ v * 4 ] = tmp.x;
        tangents[ v * 4 + 1 ] = tmp.y;
        tangents[ v * 4 + 2 ] = tmp.z;
        tangents[ v * 4 + 3 ] = w;

    }

    for ( var j = 0, jl = groups.length; j < jl; ++ j ) {

        var group = groups[ j ];

        var start = group.start;
        var count = group.count;

        for ( var i = start, il = start + count; i < il; i += 3 ) {

            handleVertex( indices[ i + 0 ] );
            handleVertex( indices[ i + 1 ] );
            handleVertex( indices[ i + 2 ] );

        }

    }

};

// ############################################################ 
//         Upload Image —— 更换背景贴图（和光影效果无关）
// ############################################################
var imageLoader = document.getElementById('imageLoader');
imageLoader.addEventListener('change', handleImage, false);
var drawing = new Image();
drawing.src = "../imgs/bgMap.png"
var imageIsInBuff = false;


const blurCanvas = document.getElementById('blurCanvas');
const blurCanvasCtx = blurCanvas.getContext('2d');
const buff = document.createElement('canvas');
buff.width = blurCanvas.width;
buff.height = blurCanvas.height;
const buffCtx = buff.getContext('2d');


function drawBlur(val){
    
    if(!imageIsInBuff){
        buffCtx.drawImage(drawing,0,0,drawing.width,drawing.height,     // source rectangle
            0, 0, buff.width, buff.height);
        imageIsInBuff = true;
    }
    blurCanvasCtx.drawImage(buff, 0, 0);
    StackBlur.canvasRGB(blurCanvas, 0, 0, blurCanvas.width, blurCanvas.height, val);
    offPlaneMaterialBackground.uniforms.u_tex0.value = new THREE.TextureLoader().load(blurCanvas.toDataURL());

}



function handleImage(e){
  var reader = new FileReader();
  reader.onload = function(event){
      imageIsInBuff = true;
      drawing = new Image();
      drawing.onload = function(){
          buffCtx.drawImage(drawing,0,0,drawing.width,drawing.height,     // source rectangle
            0, 0, buff.width, buff.height);
          drawBlur(option.blur_factor);
          //planeMaterial.uniforms.u_tex0.value = new THREE.TextureLoader().load(drawing.src);
      }
      drawing.src = event.target.result;
  }
  reader.readAsDataURL(e.target.files[0]);     
}


// ############################################################ 
//                   dat.gui —— 参数调节面板
// ############################################################

var isChangedImg = false;
var params = {
    loadFile : function() { 
      document.getElementById('imageLoader').click();
    },
    changeImg: function(){
        if(!isChangedImg){
            drawing.src = "../imgs/bgMap2.jpg"
            offPlaneMaterialBackground.uniforms.u_tex0.value = new THREE.TextureLoader().load(drawing.src);
        }
        else{
            drawing.src = "../imgs/bgMap.png"
            offPlaneMaterialBackground.uniforms.u_tex0.value = new THREE.TextureLoader().load(drawing.src);
        }
    


        isChangedImg = !isChangedImg;
    }
};

  
var option = {

    //光源、空间位置相关 参数
    auto_rotation: false,
    u_lightRadius:4000,
    plane_rotation_x:0.,
    plane_rotation_y:0.,
    plane_rotation_z:0.,
    light_rotation_x:-30.,
    light_rotation_y:0.,
    light_rotation_z:0.,
    enable_sensor:true,
    enable_helper:true,
    enable_perspective_view:true,
    enable_light_view:false,


    //模糊流动相关 参数（本案例无关）
    bg_blur_factor:0,

    enable_flow_effect:false,
    flow_noisefactor:100.,
    flow_speed:0.25,
    flow_displacement:0.3,
    flow_scale:1.,


    //环境光相关 参数
    enable_cubemap_effect:false,
    roughness: 0.5,
    metalness: 2.,
    envMapIntensity: 0.5,
    flipEnvMap: 1.,
    maxMipLevel: 10,

    sceneEnv_rotation_x:0.,
    sceneEnv_rotation_y:0.,
    sceneEnv_rotation_z:0.,

    //色彩调节相关 参数
    color_tempture_strength_day:0.4,
    color_tempture_strength_night:0.4,
    color_tempture_scale:5000,
    color_tempture_strength:0.,
    color_hue:0.,
    color_brightness:50.,
    color_saturation:1.,
    color_gamma:1.,



    //光照相关 参数
    light_luminance:0.5,
    grid_specular_strength:0.014659,
    icon_specular_strength:0.23,


    //阴影相关 参数
    shadow_range:12000.,
    shadow_radius:100.,
    shadow_mix:0.5, //0.5
    shadow_long_radius:0.5,
    shadow_long_length:6.15,
    shadow_long_strength:2.2,
    shadow_long_feather:9.84,
    shadow_short_radius:0.5,
    shadow_short_length:3.15,
    shadow_short_strength:0.8,
    shadow_short_feather:1.,

    //环境光相关 参数
    emissiveIntensity:0.2,
    shininess:50,
    reflectivity:0.7,
    refractionRatio:0.8,

    enable_fps_optimize:false,
    pixel_ratio:2,
    enable_screen:true
    

}






var gui = new dat.GUI({width:360});

var f1 = gui.addFolder('空间信息');

f1.add(option, "auto_rotation").name('自动旋转').onChange(function(value){
    //blurPass1.uniforms.metaEdge.value = value/1000+0.02;
    if(value == true){

    }
    else{
    }

});

f1.add(option, "u_lightRadius", 0, 8000, 0.01).name('旋转半径').onChange(function(value){
    light.position.set( 0, 0, value );
    cameraLight.position.set(0, 0, value);
    cameraLightHelper.update();

    lightGroup.remove(ellipsePathHelper);

    pathCurve = new THREE.EllipseCurve(
        0,  0,            // ax, aY
        value , value,           // xRadius, yRadius
        0,  2 * Math.PI,  // aStartAngle, aEndAngle
        false,            // aClockwise
        0                 // aRotation
    );

    //defines the amount of points the path will have
    pathHelper = new THREE.Path( pathCurve.getPoints( 100 ) );
    geometrycirc =  pathHelper.createPointsGeometry( 100 ); //pathHelper.createPointsGeometry( 100 );
    var materialcirc = new THREE.LineBasicMaterial( {
        color : 0x00ff00
    } );

    // Create the final object to add to the scene
    ellipsePathHelper = new THREE.Line( geometrycirc, materialcirc );
    ellipsePathHelper.position.set(0,0,0);
    ellipsePathHelper.rotation.x = -Math.PI / 2;
    
    lightGroup.add(ellipsePathHelper);

});


f1.add(option, "plane_rotation_x", -180, 180, 0.01).name('Phone Rotation X').onChange(function(value){
    eyeGroup.rotation.x = (value)/180 * Math.PI;
    //phoneModel.rotation.x = (value)/180 * Math.PI;
    eyeGroupBox.update();
    offEyeGroupBackground.rotation.x = (value)/180 * Math.PI;
    offEyeGroupEnv.rotation.x = (value)/180 * Math.PI;

});
f1.add(option, "plane_rotation_y", -180, 180, 0.01).name('Phone Rotation Y').onChange(function(value){
    eyeGroup.rotation.y = (value)/180 * Math.PI;
    //phoneModel.rotation.y = (value)/180 * Math.PI;
    eyeGroupBox.update();
    offEyeGroupBackground.rotation.y = (value)/180 * Math.PI;
    offEyeGroupEnv.rotation.y = (value)/180 * Math.PI;

});
f1.add(option, "plane_rotation_z", -180, 180, 0.01).name('Phone Rotation Z').onChange(function(value){
    eyeGroup.rotation.z = (value)/180 * Math.PI;
    //phoneModel.rotation.z = (value)/180 * Math.PI;
    eyeGroupBox.update();
    offEyeGroupBackground.rotation.z = (value)/180 * Math.PI;
    offEyeGroupEnv.rotation.z = (value)/180 * Math.PI;

});

f1.add(option, "light_rotation_x", -180, 180, 0.01).name('Light Rotation X').onChange(function(value){
    lightGroup.rotation.x = (value)/180 * Math.PI;
    offSceneEnv.rotation.x = (value)/180 * Math.PI;
    cameraTop.updateProjectionMatrix()
    cameraTop2.updateProjectionMatrix()
    cameraTop3.updateProjectionMatrix()
    cameraSide.updateProjectionMatrix()
    cameraLight.updateProjectionMatrix()
    planeShape.updateMatrixWorld();

    planeModel.updateMatrixWorld();

    // skyShape.rotation.x = (value)/180 * Math.PI;
    // skyShape.updateMatrixWorld();
});
f1.add(option, "light_rotation_y", -180, 180, 0.01).name('Light Rotation Y').onChange(function(value){
    lightGroup.rotation.y = (value)/180 * Math.PI;
    offSceneEnv.rotation.y = (value)/180 * Math.PI;
    cameraTop.updateProjectionMatrix()
    cameraTop2.updateProjectionMatrix()
    cameraTop3.updateProjectionMatrix()
    cameraSide.updateProjectionMatrix()
    cameraLight.updateProjectionMatrix()
    planeShape.updateMatrixWorld();

    planeModel.updateMatrixWorld();

    // skyShape.rotation.y = (value)/180 * Math.PI;
    // skyShape.updateMatrixWorld();

});
f1.add(option, "light_rotation_z", -180, 180, 0.01).name('Light Rotation Z').onChange(function(value){
    lightGroup.rotation.z = (value)/180 * Math.PI;
    offSceneEnv.rotation.z = (value)/180 * Math.PI;
    cameraTop.updateProjectionMatrix()
    cameraTop2.updateProjectionMatrix()
    cameraTop3.updateProjectionMatrix()
    cameraSide.updateProjectionMatrix()
    cameraLight.updateProjectionMatrix()
    planeShape.updateMatrixWorld();

    planeModel.updateMatrixWorld();

    // skyShape.rotation.z = (value)/180 * Math.PI;
    // skyShape.updateMatrixWorld();

});


var sensorOption = f1.add(option, "enable_sensor", -4000, 4000, 0.01).name('开启传感器').onChange(function(value){
});
var helperOption = f1.add(option, "enable_helper", -4000, 4000, 0.01).name('开启辅助线').onChange(function(value){
});

var perspectiveOption = f1.add(option, "enable_perspective_view", -4000, 4000, 0.01).name('开启空间视图').onChange(function(value){
});
var lightOption = f1.add(option, "enable_light_view", -4000, 4000, 0.01).name('开启光视图').onChange(function(value){
});

var f2 = gui.addFolder('背景图片');
f2.add(params, 'changeImg').name('更换图片');

f2.add(params, 'loadFile').name('上传图片');

f2.add(option, "bg_blur_factor", 0, 150, 0.01).name('Blur Factor').onChange(function(value){
    drawBlur(value)
});





var f3 = gui.addFolder('流体效果');
var flowOption = f3.add(option, "enable_flow_effect", -4000, 4000, 0.01).name('开启流动').onChange(function(value){
});

f3.add(option, "flow_noisefactor", 0, 300, 0.01).name('Noise Factor').onChange(function(value){});
f3.add(option, "flow_speed", 0, 10, 0.01).name('Noise Speed').onChange(function(value){});
f3.add(option, "flow_displacement", 0, 10, 0.01).name('Noise Displacement').onChange(function(value){});
f3.add(option, "flow_scale", 0, 10, 0.01).name('Noise Sample Scale').onChange(function(value){});


var f4 = gui.addFolder('环境光');

var cubemapOption = f4.add(option, "enable_cubemap_effect", -4000, 4000, 0.01).name('开启环境光').onChange(function(value){
});

f4.add(option, "roughness", 0, 20, 0.01).name('Env Roughness').onChange(function(value){});
f4.add(option, "metalness", 0, 20, 0.01).name('Env Metalness').onChange(function(value){});
f4.add(option, "envMapIntensity", 0, 20, 0.01).name('Env MapIntensity').onChange(function(value){});
f4.add(option, "flipEnvMap", 0, 20, 0.01).name('Env FlipEnvMap Scale').onChange(function(value){});
f4.add(option, "maxMipLevel", 0, 20, 1).name('Env MaxMipLevel').onChange(function(value){});


f4.add(option, "sceneEnv_rotation_x", -180., 180., 0.01).name('ENV RotX').onChange(function(value){
    offSceneEnv.rotation.x = (value)/180 * Math.PI;
});
f4.add(option, "sceneEnv_rotation_y", -180., 180., 0.01).name('Env RotY').onChange(function(value){
    offSceneEnv.rotation.y = (value)/180 * Math.PI;
});
f4.add(option, "sceneEnv_rotation_z", -180., 180., 0.01).name('ENV RotZ').onChange(function(value){
    offSceneEnv.rotation.z = (value)/180 * Math.PI;
});

var f5 = gui.addFolder('调色');

f5.add(option, "color_tempture_strength_day", 0., 1., 0.01).name('色温强度_白天').onChange(function(value){
});
f5.add(option, "color_tempture_strength_night", 0., 1., 0.01).name('色温强度_夜晚').onChange(function(value){
});
f5.add(option, "color_tempture_scale", 1000., 10000., 0.01).name('二次色温').onChange(function(value){
});
f5.add(option, "color_tempture_strength", 0., 1., 0.01).name('二次色温强度').onChange(function(value){
});

f5.add(option, "color_hue", 0., 360, 0.01).name('背景色调').onChange(function(value){
});
f5.add(option, "color_brightness", 0., 100, 0.01).name('明度').onChange(function(value){
});

f5.add(option, "color_saturation", 0., 2, 0.01).name('饱和度').onChange(function(value){
});

f5.add(option, "color_gamma", 0., 10., 0.01).name('伽玛校正').onChange(function(value){
});




var f6 = gui.addFolder('光影');


var dayColorParams = {color: "#ffffff" };


f6.addColor( dayColorParams, 'color' ).name('灯光白天颜色').onChange( function(value) { 
     
} );

var nightColorParams = {color: "#A5A4F4" };


f6.addColor( nightColorParams, 'color' ).name('灯光夜晚颜色').onChange( function(value) { 
     
} );

f6.add(option, "light_luminance", 0., 1, 0.01).name('灯光亮度').onChange(function(value){
});

f6.add(option, "grid_specular_strength", 0., 10, 0.01).name('网格反射光强度').onChange(function(value){
});

f6.add(option, "icon_specular_strength", 0., 10, 0.01).name('图标反射光强度').onChange(function(value){
});

f6.add(option, "shadow_range", 0., 20000, 0.01).name('阴影范围').onChange(function(value){
});


f6.add(option, "shadow_radius", 0., 10000., 0.01).name('阴影半径').onChange(function(value){
});

f6.add(option, "shadow_mix", 0., 1., 0.01).name('长短阴影融合度').onChange(function(value){
});

f6.add(option, "shadow_long_radius", 0., 10., 0.01).name('长阴影半径').onChange(function(value){
});
f6.add(option, "shadow_long_length", 0., 100., 0.01).name('长阴影长度').onChange(function(value){
});
f6.add(option, "shadow_long_strength", 0., 100., 0.01).name('长阴影强度').onChange(function(value){
});
f6.add(option, "shadow_long_feather", 0., 100., 0.01).name('长阴影羽化').onChange(function(value){
});



f6.add(option, "shadow_short_radius", 0., 10., 0.01).name('短阴影半径').onChange(function(value){
});
f6.add(option, "shadow_short_length", 0., 100., 0.01).name('短阴影长度').onChange(function(value){
});
f6.add(option, "shadow_short_strength", 0., 100., 0.01).name('短阴影强度').onChange(function(value){
});
f6.add(option, "shadow_short_feather", 0., 100., 0.01).name('短阴影羽化').onChange(function(value){
});




var f7 = gui.addFolder('模型');

var phoneColorParams = {color: "#000000" };

f7.addColor( phoneColorParams, 'color' ).name('手机模型颜色').onChange( function(value) { 
    phoneModel.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
            child.material.color.set(value);
        }
    } );
} );         

var phoneEmissiveColorParams  = {color: "#ffffff" };
f7.addColor( phoneEmissiveColorParams, 'color' ).name('手机自发光颜色').onChange( function(value) { 
    phoneModel.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
            child.material.emissive.set(value);
        }
    } );
} );
         
f7.add(option, "emissiveIntensity", 0., 10, 0.01).name('手机自发光强度').onChange(function(value){
    phoneModel.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
            child.material.emissiveIntensity = value;
        }
    } );
});

var phoneSpecularColorParams  = {color: "#2b2b2b" };
f7.addColor( phoneSpecularColorParams, 'color' ).name('手机反射光颜色').onChange( function(value) { 
    phoneModel.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
            child.material.specular.set(value);
        }
    } );
} );         

f7.add(option, "shininess", 0., 100, 0.01).name('手机反射光强度').onChange(function(value){
    phoneModel.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
            child.material.shininess = value;
        }
    } );
});

f7.add(option, "reflectivity", 0., 10, 0.01).name('环境贴图影响系数').onChange(function(value){
    phoneModel.traverse( function ( child ) {
        //console.log(child.material)
        if ( child instanceof THREE.Object3D  ) {
            child.material.reflectivity = value;
        }
    } );
});

f7.add(option, "refractionRatio", 0., 1, 0.01).name('空气折射率').onChange(function(value){
    phoneModel.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
            child.material.refractionRatio = value;
        }
    } );
});



var f8 = gui.addFolder('性能');

var fpsOption = f8.add(option, "enable_fps_optimize", -4000, 4000, 0.01).name('FPS优化(阴影调节失效)').onChange(function(value){
});
f8.add(option, "pixel_ratio", 0., 4., 0.01).name('像素密度').onChange(function(value){
});
var screenOption = f8.add(option, "enable_screen", -4000, 4000, 0.01).name('亮屏').onChange(function(value){
});


// ############################################################ 
//                  stats —— FPS监测
// ############################################################

var stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = 'fixed';
stats.dom.style.left = window.innerHeight/1170*540 + 'px';

document.body.appendChild( stats.dom );

// ############################################################ 
//                sensor —— 手机传感器类
// ############################################################

var gimbal = new Gimbal();
gimbal.enable();
gimbal.recalibrate();

var deviceOrientation = FULLTILT.getDeviceOrientation({'type': 'world'});
deviceOrientation.then(function(orientationData) {

    orientationData.listen(function() {

        var screenAdjustedEvent = orientationData.getFixedFrameEuler();

        if(option.enable_sensor){

            lightGroup.rotation.x = screenAdjustedEvent.beta/180*Math.PI;
            lightGroup.rotation.y = screenAdjustedEvent.gamma/180*Math.PI;
            lightGroup.rotation.z = screenAdjustedEvent.alpha/180*Math.PI;
        }
        eyeGroupBox.update();

    });

});


var isMobile = false;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    isMobile = true;
}

// ############################################################ 
//                  PATH —— 光源路径类
// ############################################################
// Ellipse class, which extends the virtual base class Curve
function Ellipse( xRadius, yRadius ) {

    THREE.Curve.call( this );

    // add radius as a property
    this.xRadius = xRadius;
    this.yRadius = yRadius;

 }

 Ellipse.prototype = Object.create( THREE.Curve.prototype );
 Ellipse.prototype.constructor = Ellipse;

 // define the getPoint function for the subClass
 Ellipse.prototype.getPoint = function ( t ) {

 var radians = 2 * Math.PI * t;

 return new THREE.Vector3( this.xRadius * Math.cos( radians ),
                          0,
                          this.yRadius * Math.sin( radians ) );

};


// function CustomSinCurve( scale ) {

// 	THREE.Curve.call( this );

// 	this.scale = ( scale === undefined ) ? 1 : scale;

// }

// CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
// CustomSinCurve.prototype.constructor = CustomSinCurve;

// CustomSinCurve.prototype.getPoint = function ( t ) {

// 	var tx = t * 3 - 1.5;
// 	var ty = Math.sin( 2 * Math.PI * t );
// 	var tz = 0;

// 	return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

// };



// ############################################################ 
//                          Init Scene
// ############################################################
var canvas,renderer,scene,offSceneBackground,offRenderingTargetBackground,offSceneEnv,offRenderingTargetEnv,sceneCubeMap
var canvasWidth,canvasHeight

function initCanvas(){

    // ############### Canvas & Render ############### 
    canvas = document.querySelector('#scene');


    // if(isMobile){
    //     canvasWidth = canvas.offsetWidth;
    //     canvasHeight = canvas.offsetHeight;
    // }
    // else{
    //     canvasWidth = window.innerHeight/780 * 720;
    //     canvasHeight = window.innerHeight;
    // }

    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;


    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    var gl = renderer.domElement.getContext('webgl') ||
            renderer.domElement.getContext('experimental-webgl');
    gl.getExtension('OES_standard_derivatives');


    renderer.setPixelRatio(window.devicePixelRatio > 1 ? option.pixel_ratio : 1);
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0xFFFFFF);



}



var trackRadius = 4000;

// ############################################################ 
//                          Load Shaders 
// ############################################################

var planeVert,planeFrag,planeShader
var offPlaneVertBackground,offPlaneFragBackground,offPlaneShaderBackground
var offPlaneVertEnv,offPlaneFragEnv,offPlaneShaderEnv
var reflectionCube,refractionCube
function shaderOnLoadCallBack(callback){
    mouse = new THREE.Vector2(0.0,0.0);
    
    let shaderPromise = new Promise(function(resolve, reject) {
        SHADER_LOADER.load(function(data) {
            planeVert = data.plane.vertex;
            planeFrag = data.plane.fragment;
            offPlaneVertBackground = data.offplane_background.vertex;
            offPlaneFragBackground = data.offplane_background.fragment;
            offPlaneVertEnv = data.offplane_env.vertex;
            offPlaneFragEnv = data.offplane_env.fragment;


            // offscreen rendering target —— 离屏渲染对象
            offRenderingTargetBackground = new THREE.WebGLRenderTarget(1080,2340);
            offRenderingTargetEnv = new THREE.WebGLRenderTarget(1080,2340);

            // cubemap —— 环境贴图
            var path = '../imgs/cubemap/';
            var format = '.jpg';
            var urls = [
                path + 'px' + format, path + 'nx' + format,
                path + 'py' + format, path + 'ny' + format,
                path + 'pz' + format, path + 'nz' + format
            ];

            reflectionCube = new THREE.CubeTextureLoader().load( urls );

            refractionCube = new THREE.CubeTextureLoader().load( urls );
            refractionCube.mapping = THREE.CubeRefractionMapping;



            // 背景贴图
            var textureBackground = new THREE.TextureLoader().load(drawing.src);
            textureBackground.wrapS = THREE.MirroredRepeatWrapping;
            textureBackground.wrapT = THREE.MirroredRepeatWrapping;

            // 背景 网格贴图
            var textureGrid = new THREE.TextureLoader().load('../imgs/gridMap.png' );

            // 背景 网格法线贴图
            var textureGridNormal = new THREE.TextureLoader().load( '../imgs/gridNormalMap.png' );

            // 图标贴图
            var textureIcon = new THREE.TextureLoader().load( '../imgs/iconMap.png' );
            // textureBG.wrapS = THREE.MirroredRepeatWrapping;
            // textureBG.wrapT = THREE.MirroredRepeatWrapping;
            // textureBG.repeat.set( 4, 4 );

            // 图标 SDF 阴影贴图
            var textureIconSDF = new THREE.TextureLoader().load( '../imgs/iconSDFMap.png' );
            // textureBG.wrapS = THREE.MirroredRepeatWrapping;
            // textureBG.wrapT = THREE.MirroredRepeatWrapping;
            // textureBG.repeat.set( 4, 4 );

            // 图标 法线贴图
            var textureIconNormal = new THREE.TextureLoader().load( '../imgs/iconNormalMap.png' );
            textureIconNormal.wrapS = THREE.RepeatWrapping;
            textureIconNormal.wrapT = THREE.RepeatWrapping;


            // 标准色温贴图
            var textureColorTempture = new THREE.TextureLoader().load( '../imgs/colorTemptureMap.png' );
            // 白天黑夜贴图
            var textureDayNightColorTempture = new THREE.TextureLoader().load( '../imgs/daynightColorTemptureMap.png' );
            
            // 背景 Shader
            offPlaneShaderBackground = {
                uniforms: {
                    u_time: { value: 0.0},
                    u_resolution: { value: new THREE.Vector2(1080,2340) },
                    u_mouse:{value: new THREE.Vector2(mouse.x,mouse.y)},
                    u_tex0: { type: 't', value:textureBackground },

                    enable_flow_effect:{value:false},
                    flow_noisefactor:{value: option.flow_noisefactor},
                    flow_speed:{value: option.flow_speed},
                    flow_displacement:{value: option.flow_displacement},
                    flow_scale:{value: option.flow_scale},
                    
                },
                vertexShader: offPlaneVertBackground,
                fragmentShader: offPlaneFragBackground,
            }

            // 环境光 Shader
            offPlaneShaderEnv = {
                uniforms: {
                    u_time: { value: 0.0},
                    u_resolution: { value: new THREE.Vector2(1080,2340) },
                    u_mouse:{value: new THREE.Vector2(mouse.x,mouse.y)},
                    u_lightPosition:{value: new THREE.Vector3(0,0,0)},

                    enable_cubemap_effect:{value:false},
                    envMap: { value:null },
                    roughness: { value: option.roughness },
                    metalness: { value: option.metalness },
                    envMapIntensity: { value:option.envMapIntensity },
                    flipEnvMap: { value: option.flipEnvMap },
                    maxMipLevel: {value:option.maxMipLevel},
                    
                },
                vertexShader: offPlaneVertEnv,
                fragmentShader: offPlaneFragEnv,
                derivatives: true
            }

            // 光影 Shader
            planeShader = {
                uniforms: {
                    u_time: { value: 0.0},
                    u_resolution: { value: new THREE.Vector2(1080,2340) },
                    u_mouse:{value: new THREE.Vector2(mouse.x,mouse.y)},
                    u_lightPosition:{value: new THREE.Vector3(0,0,0)},
                    u_lightRadius:{value:option.u_lightRadius},
                    u_tex0: { type: 't', value:offRenderingTargetBackground.texture },
                    u_tex1: { type: 't', value:textureGrid },
                    u_tex2: { type: 't', value:textureGridNormal },
                    u_tex3: { type: 't', value:textureIcon },
                    u_tex4: { type: 't', value:textureIconNormal },
                    u_tex5: { type: 't', value:textureIconSDF},
                    u_tex6: { type: 't', value:offRenderingTargetEnv.texture},
                    u_tex7: { type: 't', value:textureColorTempture},
                    u_tex8: { type: 't', value:textureDayNightColorTempture},
                    enable_cubemap_effect:{value:false},
                    envMap: { value:null },
                    roughness: { value: option.roughness },
                    metalness: { value: option.metalness },
                    envMapIntensity: { value:option.envMapIntensity },
                    flipEnvMap: { value: option.flipEnvMap },
                    maxMipLevel: {value:option.maxMipLevel},


                    color_tempture_strength_day:{value:option.color_tempture_strength_day},
                    color_tempture_strength_night:{value:option.color_tempture_strength_night},
                    color_tempture_scale: {value:(option.color_tempture_scale - 1000)/9000},
                    color_tempture_strength:{value:option.color_tempture_strength},
                    color_hue:{value:option.color_hue/180},
                    color_brightness:{value:(option.color_brightness - 50)/50},
                    color_saturation:{value:option.color_saturation},
                    color_gamma:{value:option.color_gamma},

                    light_day_color:{value: new THREE.Color( dayColorParams.color )},
                    light_night_color:{value: new THREE.Color( nightColorParams.color )},
                    light_luminance:{value:option.light_luminace},
                    grid_specular_strength:{value:option.grid_specular_strength},
                    icon_specular_strength:{value:option.icon_specular_strength},
                    shadow_range:{value:option.shadow_range},
                    shadow_radius:{value:option.shadow_radius},
                    shadow_long_radius:{value:option.shadow_long_radius},
                    shadow_long_length:{value:option.shadow_long_length},
                    shadow_long_feather:{value:option.shadow_long_feather},
                    shadow_long_strength:{value:option.shadow_long_strength},
                    shadow_short_radius:{value:option.shadow_short_radius},
                    shadow_short_length:{value:option.shadow_short_length},
                    shadow_short_feather:{value:option.shadow_short_feather},
                    shadow_short_strength:{value:option.shadow_short_strength},
                    shadow_mix:{value:option.shadow_mix},


                },
                vertexShader: planeVert,
                fragmentShader: planeFrag,
                derivatives: true
            }

            
            resolve("Shader loaded!");
        });
    });

    shaderPromise.then(function(value) {
        let initPromise = new Promise(function(resolve, reject) {
            callback()
            resolve("Init finished!");
        });

        initPromise.then(function(value) {
            console.log('Start to use'); // Success!
        }, function(reason) {
            console.log(reason); // Error!
        });
    
    }, function(reason) {
        console.log(reason); // Error!
    });

}

// ############################################################ 
//              Init Object —— 构建空间关系（光源关系）
// ############################################################
var cameraTop,cameraSide,cameraLight,control1,control2,light
var cameraTop2,cameraTop3
var cameraSide2 ,cameraSide3,cameraSide4
var planeGeometry,planeMaterial,planeShape
var offPlaneGeometryBackground,offPlaneMaterialBackground,offPlaneShapeBackground
var offPlaneGeometryEnv,offPlaneMaterialEnv,offPlaneShapeEnv
var cameraGeometry,cameraMaterial,cameraSphere
var eyeGroup,eyeGroupBox;
var offEyeGroupBackground,offEyeGroupEnv;
var lightGroup,lightGroupBox,newLightGroup;
var gridHelper,axisHelper,cameraTopHelper,cameraLightHelper,spotLightHelper;
var path,pathHelper,ellipsePathHelper,pathCurve;
var sceneTotalGroup;
var phoneModel,glassModel,planeModel;
//var skyGeom,skyeMat,skyShape
function initObject(){



    // ############### Camera & Scene —— 相机和唱机 ###############

    scene = new THREE.Scene();
    sceneTotalGroup = new THREE.Group();

    // skyGeom = new THREE.BoxBufferGeometry( 20000, 20000, 20000 );
    // skyeMat = new THREE.MeshBasicMaterial({color: 0xffffff,side:THREE.DoubleSide,envMap:reflectionCube});
    // skyShape =  new THREE.Mesh( skyGeom, skyeMat );
    // skyShape.scale.set(-1,-1,-1);
    // scene.add(skyShape);

    scene.background = refractionCube;

    var ambient = new THREE.AmbientLight( 0xffffff );
    sceneTotalGroup.add( ambient );

    pointLight = new THREE.PointLight( 0xffffff, 2 );
    sceneTotalGroup.add( pointLight );

    // 光源 空间半径
    var size = 4100;
    var divisions = 20;

    // 辅助线
    gridHelper = new THREE.GridHelper( size, divisions );
    gridHelper.rotation.x = -Math.PI / 2;
    sceneTotalGroup.add( gridHelper );

    axisHelper = new THREE.AxisHelper( size );
    sceneTotalGroup.add(axisHelper);


    // 上半空相机 —— 左侧
    cameraTop = new THREE.PerspectiveCamera(90, canvasWidth / canvasHeight, 1, 1170);
    cameraTop.position.set(0, 0, 1170); //1170
    cameraTop.lookAt(new THREE.Vector3(0, 0, 0));

    cameraTop2 = cameraTop.clone();
    cameraTop3 = cameraTop.clone();


    // 可控制侧边相机 —— 右侧
    cameraSide = new THREE.PerspectiveCamera(90, canvasWidth / canvasHeight, 1, 40000);
    cameraSide.position.set(0, -6000, 1170); //1170
    cameraSide.lookAt(new THREE.Vector3(0, 0, 0));
    sceneTotalGroup.add( cameraSide );


    cameraSide2 = cameraSide.clone();
    cameraSide3 = cameraSide.clone();
    cameraSide4 = cameraSide.clone();

    // 光源相机 —— 右侧
    cameraLight = new THREE.PerspectiveCamera(90, canvasWidth / canvasHeight, 1, 40000);
    cameraLight.position.set(0, 0, trackRadius);
    cameraLight.lookAt(new THREE.Vector3(0, 0, 0));
    sceneTotalGroup.add( cameraLight );


    // 辅助线
    cameraTopHelper = new THREE.CameraHelper( cameraTop );
    sceneTotalGroup.add( cameraTopHelper );


    cameraLightHelper = new THREE.CameraHelper( cameraLight );

    eyeGroup = new THREE.Group();
    eyeGroup.add( cameraTop );
  


                
    // ############### offScreen Screen —— 离屏渲染（背景、环境光，和本案例无关） ###############



    offSceneBackground = new THREE.Scene();

    offPlaneGeometryBackground = new THREE.PlaneBufferGeometry(1080., 2340., 256,256 );
    offPlaneMaterialBackground = new THREE.ShaderMaterial(offPlaneShaderBackground);
    offPlaneShapeBackground = new THREE.Mesh( offPlaneGeometryBackground, offPlaneMaterialBackground );
    offPlaneShapeBackground.position.set(0,0,0);

    offEyeGroupBackground = new THREE.Group();
    offEyeGroupBackground.add( cameraTop2 );
    offEyeGroupBackground.add( offPlaneShapeBackground);
    offSceneBackground.add(offEyeGroupBackground);
    offSceneBackground.add( cameraSide2 );

    offSceneEnv = new THREE.Scene();
    offSceneEnv.background = refractionCube;
    offPlaneGeometryEnv = new THREE.PlaneBufferGeometry(1080., 2340., 256,256 );
    offPlaneMaterialEnv = new THREE.ShaderMaterial(offPlaneShaderEnv);
    offPlaneShapeEnv = new THREE.Mesh( offPlaneGeometryEnv, offPlaneMaterialEnv );
    offPlaneShapeEnv.position.set(0,0,0);

    offEyeGroupEnv = new THREE.Group();
    offEyeGroupEnv.add( cameraTop3 );
    offEyeGroupEnv.add( offPlaneShapeEnv);
    offPlaneMaterialEnv.extensions.derivatives = true;
    offPlaneMaterialEnv.envMap = reflectionCube;  //reflectionCube;
    offSceneEnv.add(offEyeGroupEnv);
    offSceneEnv.add( cameraSide3 );


    // ############### OrbitControls —— 鼠标控制 ###############


    control1 = new THREE.OrbitControls( cameraSide, renderer.domElement );
    control2 = new THREE.OrbitControls( cameraSide3, renderer.domElement );



    // ############### Light —— 光源 ###############

    light = new THREE.SpotLight( 0xFFFFFF);
    light.position.set( 0, 0, trackRadius );

    lightGroup = new THREE.Group();
    lightGroup.add(light);
    //scene.add( light );

    spotLightHelper = new THREE.SpotLightHelper( light );
    sceneTotalGroup.add( spotLightHelper );


    // ############### LoadModel —— 加载手机模型（本案例无关） ###############

    var loaderPhone = new THREE.OBJLoader();

    loaderPhone.load('../models/darwin.obj', function ( obj ) {
        phoneModel = obj

        phoneModel.traverse( function ( child ) {
            if ( child instanceof THREE.Object3D  ) {
                child.material = new THREE.MeshPhongMaterial( {
                    emissiveIntensity : option.emissiveIntensity,
                    emissive:new THREE.Color( phoneEmissiveColorParams.color ),
                    shininess: option.shininess, 
                    color: new THREE.Color( phoneColorParams.color ), 
                    specular: new THREE.Color( phoneSpecularColorParams.color ), 
                    reflectivity:option.reflectivity, 
                    refractionRatio: option.refractionRatio,
                    envMap: reflectionCube
                });
                if(child.name=='Torus'){
                    alert("torus");//
                    
                }
     
            }
        } );

        phoneModel.scale.set(152,152,152);
        phoneModel.position.z = -4;
        phoneModel.rotation.y = (180)/180 * Math.PI;
        //console.log(phoneModel)
        eyeGroup.add(phoneModel)
    });

    var loaderGlass = new THREE.OBJLoader();

    loaderGlass.load('../models/glass.obj', function ( obj ) {
        glassModel = obj

        glassModel.traverse( function ( child ) {
            if ( child instanceof THREE.Object3D  ) {
                child.material = new THREE.MeshPhongMaterial( {
                    emissiveIntensity : 0.2,
                    emissive:new THREE.Color('#ffffff'),
                    shininess: 4, 
                    color: new THREE.Color('#000000'), 
                    specular: new THREE.Color('#ffffff'), 
                    reflectivity:0.3, 
                    refractionRatio: 0.98,
                    envMap: reflectionCube,
                    opacity: 0.15,
                    transparent: true,
                });
                if(child.name=='Torus'){
                    alert("torus");//
                    
                }
                
     
            }
        } );

        glassModel.scale.set(152,152,152);
        glassModel.position.z = -4;
        glassModel.rotation.y = (180)/180 * Math.PI;
        //console.log(glassModel)
        eyeGroup.add(glassModel)
    });



    // ### TODO
    var loaderPlane = new THREE.ColladaLoader();

    loaderPlane.load('../models/plane.dae', function ( result ) {
        //console.log();
        //console.log(result.scene.children[0])

        //planeModel = result.scene.children[0]

        // planeModel.traverse( function ( child ) {
        //     if ( child instanceof THREE.Object3D  ) {
        //         child.material = new THREE.ShaderMaterial(planeShader);
        //         child.material.side = THREE.DoubleSide;
        //         child.material.extensions.derivatives = true;
        //         child.material.envMap = reflectionCube;  //reflectionCube;
        //         child.geometry.computeTangents();
     
        //     }
        // } );
        var planeModelGeometry = result.scene.children[0].geometry;
        var planeModelMaterial = new THREE.ShaderMaterial(planeShader);
        planeModelMaterial.side = THREE.DoubleSide;
        planeModelMaterial.extensions.derivatives = true;
        planeModelMaterial.envMap = reflectionCube;  //reflectionCube;
        planeModel = new THREE.Mesh( planeModelGeometry, planeModelMaterial );
        planeModel.position.set(0,0,0)

        // planeModel.material = new THREE.ShaderMaterial(planeShader);
        // planeModel.material.side = THREE.DoubleSide;
        // planeModel.material.extensions.derivatives = true;
        // planeModel.material.envMap = reflectionCube;  //reflectionCube;
        // planeModel.geometry.computeTangents();

        planeModel.geometry.computeTangents();
        // console.log(planeModel)
        eyeGroup.add(planeModel)
    });
    


    // ############### Object ###############

    // 上半空相机辅助观察点
    cameraGeometry = new THREE.SphereBufferGeometry( 20, 3, 3 );
    cameraMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    cameraSphere = new THREE.Mesh( cameraGeometry, cameraMaterial );
    cameraSphere.position.set(cameraTop.position.x,cameraTop.position.y,cameraTop.position.z)
    eyeGroup.add( cameraSphere );


    // 手机屏幕 Plane
    planeGeometry = new THREE.PlaneBufferGeometry(1080., 2340., 256,256 );
    planeMaterial = new THREE.ShaderMaterial(planeShader);
    planeMaterial.side = THREE.DoubleSide;
    planeMaterial.extensions.derivatives = true;
    planeMaterial.envMap = reflectionCube;  //reflectionCube;
    planeShape = new THREE.Mesh( planeGeometry, planeMaterial );
    planeShape.position.set(0,0,0)
    planeGeometry.computeTangents();
    eyeGroup.add( planeShape );


    sceneTotalGroup.add( eyeGroup );
    eyeGroupBox = new THREE.BoxHelper( eyeGroup, 0x00ff00 );
    sceneTotalGroup.add( eyeGroupBox );



    ////////////////////////////////////////
    //      Create an Extruded shape      //
    ////////////////////////////////////////

    // ### path
    // path = new Ellipse( trackRadius, trackRadius);
    // //path = new CustomSinCurve( 1000 );
    // // params
    // var pathSegments = 64;
    // var tubeRadius = 10.5;
    // var radiusSegments = 16;
    // var closed = true;

    // var pathGeometry = new THREE.TubeBufferGeometry( path, pathSegments, tubeRadius, radiusSegments, closed );

    // // material
    // var pathMaterial = new THREE.MeshPhongMaterial( {
    //     color: 0xFFFFFF, 
    // } );

    // // mesh
    // var pathMesh = new THREE.Mesh( pathGeometry, pathMaterial );
    // lightGroup.add(pathMesh)




    //////////////////////////////////////////////////////////////////////////
    //       Create the PathHelper                                          //
    //////////////////////////////////////////////////////////////////////////

    //Please note that this red ellipse was only created has a guide so that I could  be certain that the square is true to the tangent and positioning.

    // Ellipse class, which extends the virtual base class Curve

    // ######################### 光源环绕半径 #########################
    pathCurve = new THREE.EllipseCurve(
        0,  0,            // ax, aY
        trackRadius , trackRadius,           // xRadius, yRadius
        0,  2 * Math.PI,  // aStartAngle, aEndAngle
        false,            // aClockwise
        0                 // aRotation
    );

    //defines the amount of points the path will have
    pathHelper = new THREE.Path( pathCurve.getPoints( 100 ) );
    geometrycirc =  pathHelper.createPointsGeometry( 100 ); //pathHelper.createPointsGeometry( 100 );
    var materialcirc = new THREE.LineBasicMaterial( {
        color : 0x00ff00
    } );

    // Create the final object to add to the scene
    ellipsePathHelper = new THREE.Line( geometrycirc, materialcirc );
    ellipsePathHelper.position.set(0,0,0);
    ellipsePathHelper.rotation.x = -Math.PI / 2;
    lightGroup.add( ellipsePathHelper );
    lightGroup.rotation.x = (option.light_rotation_x)/180 * Math.PI;
    sceneTotalGroup.add( lightGroup );


    ellipsePathHelper.geometry.computeBoundingSphere()
    scene.add(sceneTotalGroup);

}


// ############################################################ 
//                          Render Pass
// ############################################################
var composer,composer2,composer3,scenePass,scenePass2,scenePass3
function addRenderPass(){

    if(isMobile){
        cameraTop.aspect = Math.floor(canvasWidth ) / canvasHeight;
        cameraTop2.aspect = Math.floor(canvasWidth ) / canvasHeight;
        cameraTop3.aspect = Math.floor(canvasWidth ) / canvasHeight;
        cameraTop.updateProjectionMatrix();
        cameraTop2.updateProjectionMatrix();
        cameraTop3.updateProjectionMatrix();
        cameraSide.aspect = Math.floor(canvasWidth / 2) / Math.floor(canvasWidth / 2);
        cameraSide2.aspect = Math.floor(canvasWidth / 2) / Math.floor(canvasWidth / 2);
        cameraSide3.aspect = Math.floor(canvasWidth / 2) / Math.floor(canvasWidth / 2);
        cameraLight.aspect = 1;
    }
    else{
        cameraTop.aspect = canvasHeight/780*360 / canvasHeight;
        cameraTop2.aspect = canvasHeight/780*360 / canvasHeight;
        cameraTop3.aspect = canvasHeight/780*360 / canvasHeight;
        cameraTop.updateProjectionMatrix();
        cameraTop2.updateProjectionMatrix();
        cameraTop3.updateProjectionMatrix();
        cameraSide.aspect = (canvasWidth - canvasHeight*360/780)/ canvasHeight;
        cameraSide2.aspect = (canvasWidth - canvasHeight*360/780)/ canvasHeight;
        cameraSide3.aspect = (canvasWidth - canvasHeight*360/780)/ canvasHeight;
        cameraLight.aspect = (canvasWidth - canvasHeight*360/780)/ canvasHeight;
    }

    // 上半空视图渲染器
    composer = new THREE.EffectComposer(renderer);


    scenePass = new THREE.RenderPass(scene, cameraTop);
    composer.addPass(scenePass);


    scenePass.renderToScreen = true;

    

    // 侧边可控制视图渲染器
    composer2 = new THREE.EffectComposer(renderer);

    cameraSide.updateProjectionMatrix();
    scenePass2 = new THREE.RenderPass(scene, cameraSide);
    composer2.addPass(scenePass2);

    scenePass2.renderToScreen = true;


    // 侧边光视图渲染器
    composer3 = new THREE.EffectComposer(renderer);

    cameraLight.updateProjectionMatrix();
    scenePass3 = new THREE.RenderPass(scene, cameraLight);
    composer3.addPass(scenePass3);


    scenePass3.renderToScreen = true;


}


// ############################################################ 
//                         Render Functions
// ############################################################


var t = 0;

function render(a) {
    requestAnimationFrame(render);

    renderer.setPixelRatio(window.devicePixelRatio > 1 ? option.pixel_ratio : 1);
    // ############### Final Render ###############

    //光源移动
    objectAlongPath(light,path);

    stats.update();
    //Plane Material Uniforms

    //背景 Uniform —— 本案例无关
    offPlaneMaterialBackground.uniforms.u_time.value = a/1000.;
    offPlaneMaterialBackground.uniforms.u_mouse.value = new THREE.Vector2((mouse.x+1)/2,(mouse.y+1)/2);
    offPlaneMaterialBackground.uniforms.u_resolution.value = new THREE.Vector2((canvasHeight*360/780)*option.pixel_ratio, canvasHeight*option.pixel_ratio);
    
    offPlaneMaterialBackground.uniforms.enable_flow_effect.value = option.enable_flow_effect;
    offPlaneMaterialBackground.uniforms.flow_noisefactor.value = option.flow_noisefactor;
    offPlaneMaterialBackground.uniforms.flow_speed.value = option.flow_speed;
    offPlaneMaterialBackground.uniforms.flow_displacement.value = option.flow_displacement;
    offPlaneMaterialBackground.uniforms.flow_scale.value = option.flow_scale;

    //环境光 Uniform —— 本案例无关
    offPlaneMaterialEnv.uniforms.u_time.value = a/1000.;
    offPlaneMaterialEnv.uniforms.u_mouse.value = new THREE.Vector2((mouse.x+1)/2,(mouse.y+1)/2);
    offPlaneMaterialEnv.uniforms.u_resolution.value = new THREE.Vector2((canvasHeight*360/780)*option.pixel_ratio, canvasHeight*option.pixel_ratio);

    
    offPlaneMaterialEnv.uniforms.enable_cubemap_effect.value = option.enable_cubemap_effect;
    offPlaneMaterialEnv.uniforms.roughness.value = option.roughness;
    offPlaneMaterialEnv.uniforms.metalness.value = option.metalness;
    offPlaneMaterialEnv.uniforms.envMapIntensity.value = option.envMapIntensity;
    offPlaneMaterialEnv.uniforms.flipEnvMap.value = option.flipEnvMap;
    offPlaneMaterialEnv.uniforms.maxMipLevel.value = option.maxMipLevel;

    //光影效果 Uniform —— 本案例无关
    planeMaterial.uniforms.u_time.value = a/1000.;
    planeMaterial.uniforms.u_mouse.value = new THREE.Vector2((mouse.x+1)/2,(mouse.y+1)/2);
    planeMaterial.uniforms.u_resolution.value = new THREE.Vector2((canvasHeight*360/780)*option.pixel_ratio, canvasHeight*option.pixel_ratio);


    planeMaterial.uniforms.u_lightRadius.value = option.u_lightRadius;

    
    planeMaterial.uniforms.enable_cubemap_effect.value = option.enable_cubemap_effect;
    planeMaterial.uniforms.roughness.value = option.roughness;
    planeMaterial.uniforms.metalness.value = option.metalness;
    planeMaterial.uniforms.envMapIntensity.value = option.envMapIntensity;
    planeMaterial.uniforms.flipEnvMap.value = option.flipEnvMap;
    planeMaterial.uniforms.maxMipLevel.value = option.maxMipLevel;
    
    planeMaterial.uniforms.color_tempture_strength_day.value = option.color_tempture_strength_day;
    planeMaterial.uniforms.color_tempture_strength_night.value = option.color_tempture_strength_night;
    planeMaterial.uniforms.color_tempture_scale.value = (option.color_tempture_scale - 1000)/9000;
    planeMaterial.uniforms.color_tempture_strength.value = option.color_tempture_strength;
    planeMaterial.uniforms.color_hue.value = option.color_hue/180;
    planeMaterial.uniforms.color_brightness.value =(option.color_brightness - 50)/50;
    planeMaterial.uniforms.color_saturation.value = option.color_saturation;
    planeMaterial.uniforms.color_gamma.value = option.color_gamma;
    

    planeMaterial.uniforms.light_day_color.value = new THREE.Color( dayColorParams.color);
    planeMaterial.uniforms.light_night_color.value = new THREE.Color( nightColorParams.color);
    planeMaterial.uniforms.light_luminance.value = option.light_luminance;
    planeMaterial.uniforms.grid_specular_strength.value = option.grid_specular_strength;
    planeMaterial.uniforms.icon_specular_strength.value = option.icon_specular_strength;

    
    if(!option.enable_fps_optimize){
        planeMaterial.uniforms.shadow_range.value = option.shadow_range;
        planeMaterial.uniforms.shadow_radius.value = option.shadow_radius;
        planeMaterial.uniforms.shadow_mix.value = option.shadow_mix;
        planeMaterial.uniforms.shadow_long_radius.value = option.shadow_long_radius;
        planeMaterial.uniforms.shadow_long_length.value = option.shadow_long_length;
        planeMaterial.uniforms.shadow_long_feather.value = option.shadow_long_feather;
        planeMaterial.uniforms.shadow_long_strength.value = option.shadow_long_strength;
        planeMaterial.uniforms.shadow_short_radius.value = option.shadow_short_radius;
        planeMaterial.uniforms.shadow_short_length.value = option.shadow_short_length;
        planeMaterial.uniforms.shadow_short_feather.value = option.shadow_short_feather;
        planeMaterial.uniforms.shadow_short_strength.value = option.shadow_short_strength;
    }

    // 离屏渲染 背景
    renderer.render(offSceneBackground, cameraTop2, offRenderingTargetBackground); 
    // 离屏幕渲染 环境光
    renderer.render(offSceneEnv, cameraTop3, offRenderingTargetEnv); 
    //prevent canvas from being erased with next .render call


    // 以下处理了 手机、电脑端 视图的开关
    // ## 2 pass other rendering TODO Optim Here
    if(isMobile){
        gridHelper.visible = false;
        axisHelper.visible = false;
        cameraTopHelper.visible = false;
        cameraLightHelper.visible = false;
        spotLightHelper.visible = false;
        ellipsePathHelper.visible = false;
        cameraSphere.visible = false;
        eyeGroupBox.visible = false;
        phoneModel.visible = false;
        glassModel.visible = false;
        planeModel.visible = false;
        planeShape.visible = true;
        renderer.setViewport(0, 0, Math.floor(canvasWidth), canvasHeight);
        renderer.setScissor(0, 0, Math.floor(canvasWidth), canvasHeight);
        renderer.setScissorTest(true);
        composer.render();

        if(option.enable_perspective_view){
            gridHelper.visible = true;
            axisHelper.visible = true;
            cameraTopHelper.visible = true;
            cameraLightHelper.visible = true;
            spotLightHelper.visible = true;
            ellipsePathHelper.visible = true;
            cameraSphere.visible = true;
            eyeGroupBox.visible = true;
            phoneModel.visible = true;
            glassModel.visible = true;
            if(option.enable_screen){
                planeModel.visible = true;
            }
            planeShape.visible = false;
            if(!option.enable_helper){
                gridHelper.visible = false;
                axisHelper.visible = false;
                cameraTopHelper.visible = false;
                cameraLightHelper.visible = false;
                spotLightHelper.visible = false;
                ellipsePathHelper.visible = false;
                cameraSphere.visible = false;
                eyeGroupBox.visible = false;
            }

            renderer.setViewport(0,canvasHeight - Math.floor(canvasWidth), Math.floor(canvasWidth ), Math.floor(canvasWidth ));
            renderer.setScissor(0,canvasHeight -  Math.floor(canvasWidth), Math.floor(canvasWidth ), Math.floor(canvasWidth));
            renderer.setScissorTest(true);
            composer2.render();



        }

        if(option.enable_light_view){
            gridHelper.visible = false;
            axisHelper.visible = false;
            cameraTopHelper.visible = false;
            cameraLightHelper.visible = false;
            spotLightHelper.visible = false;
            ellipsePathHelper.visible = false;
            cameraSphere.visible = false;
            eyeGroupBox.visible = false;
            phoneModel.visible = true;
            glassModel.visible = true;
            if(option.enable_screen){
                planeModel.visible = true;
            }
            planeShape.visible = false;
            renderer.setViewport(0,canvasHeight - Math.floor(canvasWidth), Math.floor(canvasWidth ), Math.floor(canvasWidth ));
            renderer.setScissor(0,canvasHeight -  Math.floor(canvasWidth), Math.floor(canvasWidth ), Math.floor(canvasWidth));
            renderer.setScissorTest(true);
            composer3.render();
        }
        



    }
    else{

        // PC 左侧
        gridHelper.visible = false;
        axisHelper.visible = false;
        cameraTopHelper.visible = false;
        cameraLightHelper.visible = false;
        spotLightHelper.visible = false;
        ellipsePathHelper.visible = false;
        cameraSphere.visible = false;
        eyeGroupBox.visible = false;
        phoneModel.visible = false;
        glassModel.visible = false;
        planeModel.visible = false;
        planeShape.visible = true;
        renderer.setViewport(0, 0, canvasHeight/780*360, canvasHeight);
        renderer.setScissor(0, 0, canvasHeight/780*360, canvasHeight);
        renderer.setScissorTest(true);
        composer.render();


        // PC 左侧 —— 可移动视图
        if(option.enable_perspective_view){
            gridHelper.visible = true;
            axisHelper.visible = true;
            cameraTopHelper.visible = true;
            cameraLightHelper.visible = true;
            spotLightHelper.visible = true;
            ellipsePathHelper.visible = true;
            cameraSphere.visible = true;
            eyeGroupBox.visible = true;
            phoneModel.visible = true;
            glassModel.visible = true;
            if(option.enable_screen){
                planeModel.visible = true;
            }
            planeShape.visible = false;

            if(!option.enable_helper){
                gridHelper.visible = false;
                axisHelper.visible = false;
                cameraTopHelper.visible = false;
                cameraLightHelper.visible = false;
                spotLightHelper.visible = false;
                ellipsePathHelper.visible = false;
                cameraSphere.visible = false;
                eyeGroupBox.visible = false;
            }

            
            renderer.setViewport((canvasHeight*360/780), 0, canvasWidth - (canvasHeight*360/780), canvasHeight);
            renderer.setScissor((canvasHeight*360/780), 0,canvasWidth - (canvasHeight*360/780), canvasHeight);
            renderer.setScissorTest(true);
            //renderer.setClearColor( 0xffffff, 0);
            composer2.render();

        }
        // PC 右侧 —— 光视图
        if(option.enable_light_view){
            gridHelper.visible = false;
            axisHelper.visible = false;
            cameraTopHelper.visible = false;
            cameraLightHelper.visible = false;
            spotLightHelper.visible = false;
            ellipsePathHelper.visible = false;
            cameraSphere.visible = false;
            eyeGroupBox.visible = false;
            phoneModel.visible = true;
            glassModel.visible = true;
            if(option.enable_screen){
                planeModel.visible = true;
            }
            planeShape.visible = false;
            renderer.setViewport((canvasHeight*360/780), 0, canvasWidth - (canvasHeight*360/780), canvasHeight);
            renderer.setScissor((canvasHeight*360/780), 0,canvasWidth - (canvasHeight*360/780), canvasHeight);
            renderer.setScissorTest(true);
            composer3.render();

        }


    }


}

function objectAlongPath(obj,path){
    // set the marker position
    // var pt = path.getPoint( t );

    // // set the marker position
    // obj.position.set( pt.x, pt.y, pt.z );

    // // get the tangent to the curve
    // var tangent = path.getTangent( t ).normalize();

    // // calculate the axis to rotate around
    // var up = new THREE.Vector3( 0,0,1.);
    // var axis = new THREE.Vector3( );
    // axis.crossVectors( up, tangent ).normalize();

    // // calcluate the angle between the up vector and the tangent
    // var radians = Math.acos( up.dot( tangent ) );

    // // set the quaternion
    // obj.quaternion.setFromAxisAngle( axis, radians);
    //console.log(radians)

    //console.log(radians);

    //cameraLight.position.set( light.getWorldPosition(worldPosition).x, light.getWorldPosition(worldPosition).y, light.getWorldPosition(worldPosition).z );
    //cameraLight.quaternion.setFromAxisAngle( axis, radians );



    // 光源圆环的旋转
    if(option.auto_rotation){
        t = (t >= Math.PI*2) ? 0 : t += 0.01;
        lightGroup.rotation.y = -t;
        offSceneEnv.rotation.y = -t;
    }
    else{
        lightGroup.rotation.y = option.light_rotation_y/180 * Math.PI  ;
    }

    // Light Camera
    var worldPosition = new THREE.Vector3()
    cameraLight.position.set(obj.getWorldPosition(worldPosition).x,obj.getWorldPosition(worldPosition).y,obj.getWorldPosition(worldPosition).z)
    planeMaterial.uniforms.u_lightPosition.value = new THREE.Vector3(obj.getWorldPosition(worldPosition).x,obj.getWorldPosition(worldPosition).y,obj.getWorldPosition(worldPosition).z);

    //planeModel.material.uniforms.u_lightPosition.value = new THREE.Vector3(obj.getWorldPosition(worldPosition).x,obj.getWorldPosition(worldPosition).y,obj.getWorldPosition(worldPosition).z);

    //console.log(planeMaterial.uniforms.u_lightPosition.value)

    var quaternion = new THREE.Quaternion()
    var worldQuaternion = obj.getWorldQuaternion(quaternion);
    cameraLight.quaternion.set(worldQuaternion.x,worldQuaternion.y,worldQuaternion.z,worldQuaternion.w);
    //cameraLight.lookAt(new THREE.Vector3(0.,0.,0.))

}


// ############################################################ 
//               Event Functions —— 鼠标事件
// ############################################################

function addMouseEvent(){

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove);

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("touchstart", onMouseDown);

    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
    window.addEventListener("touchcancel", onMouseUp);
    window.addEventListener("mouseleave", onMouseUp);
    window.addEventListener("mouseout", onMouseUp);


}


// ############### Resize ###############

window.onresize = function onResize() {
    // canvas.style.width = '';
    // canvas.style.height = '';
    // width = canvas.offsetWidth;
    // height = canvas.offsetHeight;
    // camera.aspect = width / height;
    // camera.updateProjectionMatrix();  



    // if(isMobile){
    //     canvasWidth = canvas.offsetWidth;
    //     canvasHeight = canvas.offsetHeight;
    // }
    // else{
    //     canvasWidth = window.innerHeight/780 * 720;
    //     canvasHeight = window.innerHeight;
    // }

    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;



    
    // canvas.style.width = 657; //window.innerHeight/(108./162.)
    // canvas.style.height = 986; //window.innerHeight
    // planeShape.geometry = new THREE.PlaneBufferGeometry( 657,986, 256,256 );
    // this.console.log('resize');
    renderer.setSize(canvasWidth, canvasHeight);
   
}


// #### Acceleration ####
document.documentElement.onmousemove = function (event) {
  currentEvent = event;
};

setInterval(function () {
    //console.log('500ms - passed')
}, 500);



// ############### Mouse ###############
var mouse
function onMouseMove(e) {
    //console.log('mouseEvent - Move')
    //console.log(window.innerWidth)
    TweenMax.to(mouse, 0.0, {
        x : ( event.clientX / window.innerWidth ) * 2 - 1,
        y: - ( event.clientY / window.innerHeight ) * 2 + 1
    });
}




function onMouseUp(e) {
    //console.log('mouseEvent - Up')

}

function onMouseDown(e) {
    //console.log('mouseEvent - Down')
}


