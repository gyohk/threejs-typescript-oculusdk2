var app;
(function (app) {
    "use strict";
    var Main = (function () {
        function Main() {
            var _this = this;
            this.onWindowResize = function (event) {
                _this.windowHalfX = window.innerWidth / 2;
                _this.windowHalfY = window.innerHeight / 2;
                _this.camera.aspect = window.innerWidth / window.innerHeight;
                _this.camera.updateProjectionMatrix();
                _this.renderer.setSize(window.innerWidth, window.innerHeight);
                _this.effect.setSize(window.innerWidth, window.innerHeight);
                if (_this.controlEnabled) {
                    _this.controls.handleResize();
                }
            };
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
            }
            this.mouseX = 0;
            this.mouseY = 0;
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            this.POINTS = 100;
            this.SPREAD = 400;
            this.SUBDIVISIONS = 20;
            this.VISIBLE_POINTS = 7 * this.SUBDIVISIONS;
            this.SPEED = 1.4;
            this.BRUSHES = 5;
            this.DIZZY = false;
            this.points = [];
            this.midpoints = [];
            this.chains = [];
            this.brushes = [];
            this.colors = [];
            this.controlEnabled = true;
            this.t = 0;
            this.v = [];
            this.tmp = new THREE.Vector3();
            this.lookAt = new THREE.Vector3();
            this.dizzy;
            this.materials = [];
            this.MAX_HEIGHT = 6;
            this.worldWidth = 128;
            this.worldDepth = 128;
            this.worldHalfWidth = this.worldWidth / 2;
            this.worldHalfDepth = this.worldDepth / 2;
            this.init();
            this.animate();
        }
        Main.prototype.init = function () {
            var _this = this;
            this.restart();
            this.initThree();
            this.initScene();
            this.initPostProcessing();
            this.dizzy();
            document.addEventListener('mousedown', function () { return _this.restart; }, false);
            window.addEventListener('resize', this.onWindowResize, false);
        };
        Main.prototype.initThree = function () {
            var container;
            container = document.createElement('div');
            document.body.appendChild(container);
            this.camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = 700;
            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.autoClear = false;
            container.appendChild(this.renderer.domElement);
            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.top = '0px';
            container.appendChild(this.stats.domElement);
        };
        Main.prototype.initScene = function () {
            this.clock = new THREE.Clock();
            var i;
            this.material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                opacity: 1,
                linewidth: 5,
                vertexColors: THREE.VertexColors
            });
            var line;
            for (var b = this.BRUSHES; b--;) {
                var brush = new Brush();
                this.brushes.push(brush);
                var lpoints = brush.points;
                for (i = 0; i < this.POINTS - 1; i++) {
                    this.chain = this.chains[b];
                    this.curve = this.chain.curve;
                    this.midpoints = this.chain.midpoints;
                    this.points = this.chain.points;
                    this.curve.v0 = this.midpoints[i];
                    this.curve.v1 = this.points[i];
                    this.curve.v2 = this.midpoints[i + 1];
                    for (var j = 0; j < this.SUBDIVISIONS; j++) {
                        lpoints.push(this.curve.getPoint(j / this.SUBDIVISIONS));
                    }
                }
            }
            for (b = this.BRUSHES; b--;) {
                brush = this.brushes[b];
                this.geometry = brush.geometry;
                line = new THREE.Line(this.geometry, this.material);
                this.scene.add(line);
                this.colors = this.geometry.colors;
                for (i = 0; i < this.VISIBLE_POINTS; i++) {
                    this.geometry.vertices.push(new THREE.Vector3());
                    this.colors[i] = new THREE.Color(0xffffff);
                }
            }
            this.scene.fog = new THREE.FogExp2(0x000000, 0.0008);
            this.pgeometry = new THREE.Geometry();
            this.sprite1 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake1.png");
            this.sprite2 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake2.png");
            this.sprite3 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake3.png");
            this.sprite4 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake4.png");
            this.sprite5 = THREE.ImageUtils.loadTexture("textures/sprites/snowflake5.png");
            for (i = 0; i < 10000; i++) {
                var vertex = new THREE.Vector3();
                vertex.x = Math.random() * 2000 - 1000;
                vertex.y = Math.random() * 2000 - 1000;
                vertex.z = Math.random() * 2000 - 1000;
                this.pgeometry.vertices.push(vertex);
            }
            this.parameters = [
                [[1.0, 0.2, 0.5], this.sprite2, 20],
                [[0.95, 0.1, 0.5], this.sprite3, 15],
                [[0.90, 0.05, 0.5], this.sprite1, 10],
                [[0.85, 0, 0.5], this.sprite5, 8],
                [[0.80, 0, 0.5], this.sprite4, 5],
            ];
            for (i = 0; i < this.parameters.length; i++) {
                this.color = this.parameters[i][0];
                this.sprite = this.parameters[i][1];
                this.size = this.parameters[i][2];
                this.materials[i] = new THREE.PointCloudMaterial({
                    size: this.size,
                    map: this.sprite,
                    blending: THREE.AdditiveBlending,
                    depthTest: false,
                    transparent: true
                });
                this.materials[i].color.setHSL(this.color[0], this.color[1], this.color[2]);
                this.particles = new THREE.PointCloud(this.pgeometry, this.materials[i]);
                this.particles.rotation.x = Math.random() * 6;
                this.particles.rotation.y = Math.random() * 6;
                this.particles.rotation.z = Math.random() * 6;
                this.scene.add(this.particles);
            }
            this.scene.add(new THREE.AmbientLight(0xFFFFFF));
            this.tgeometry = new THREE.PlaneGeometry(20000, 20000, this.worldWidth - 1, this.worldDepth - 1);
            this.tgeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
            var il;
            for (i = 0, il = this.geometry.vertices.length; i < il; i++) {
                this.tgeometry.vertices[i].y = 35 * Math.sin(i / 2);
            }
            this.tgeometry.computeFaceNormals();
            this.tgeometry.computeVertexNormals();
            var texture = THREE.ImageUtils.loadTexture("textures/water.jpg");
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(5, 5);
            this.tmaterial = new THREE.MeshBasicMaterial({ color: 0x0044ff, map: texture });
            this.tmesh = new THREE.Mesh(this.tgeometry, this.tmaterial);
            this.tmesh.position.set(0, -200, 0);
            this.scene.add(this.tmesh);
        };
        Main.prototype.initPostProcessing = function () {
            if (this.controlEnabled) {
                this.controls = new THREE.DK2Controls(this.camera);
            }
            this.effect = new THREE.OculusRiftEffect(this.renderer, { scale: 1.0 });
            this.effect.setSize(window.innerWidth, window.innerHeight);
        };
        Main.prototype.animate = function () {
            var _this = this;
            requestAnimationFrame(function () { return _this.animate(); });
            this.render();
            this.stats.update();
        };
        Main.prototype.render = function () {
            var i, j, l;
            this.t += this.SPEED;
            this.u = this.t | 0;
            for (j = this.BRUSHES; j--;) {
                var brush = this.brushes[j];
                this.geometry = brush.geometry;
                var lpoints = brush.points;
                for (i = 0; i < this.VISIBLE_POINTS; i++) {
                    var v = (i + this.u) % lpoints.length;
                    this.geometry.vertices[i].copy(lpoints[v]);
                    var d = i / this.VISIBLE_POINTS;
                    d = 1 - (1 - d) * (1 - d);
                    this.geometry.colors[i].setHSL(brush.hueOffset + (v / lpoints.length * 4) % 1, 0.7, 0.2 + d * 0.4);
                }
                this.geometry.verticesNeedUpdate = true;
                this.geometry.colorsNeedUpdate = true;
            }
            if (!this.DIZZY) {
                var targetAngle = this.mouseX / this.windowHalfX * Math.PI;
                var targetX = Math.cos(targetAngle) * 500;
                var targetZ = Math.sin(targetAngle) * 300;
                this.camera.position.x += (targetX - this.camera.position.x) * .04;
                this.camera.position.y += (-this.mouseY + 200 - this.camera.position.y) * .05;
                this.camera.position.z += (targetZ - this.camera.position.z) * .04;
                this.camera.lookAt(this.scene.position);
            }
            else {
                this.v = this.geometry.vertices;
                this.tmp.copy(this.v[this.v.length * 0.4 | 0]);
                this.tmp.y += 50;
                this.camera.position.x += (this.tmp.x - this.camera.position.x) * .04;
                this.camera.position.y += (this.tmp.y - this.camera.position.y) * .05;
                this.camera.position.z += (this.tmp.z - this.camera.position.z) * .04;
                this.tmp.copy(this.lookAt);
                this.lookAt.subVectors(this.v[this.v.length - 2], this.lookAt).multiplyScalar(0.5);
                this.lookAt.add(this.tmp);
                this.camera.lookAt(this.lookAt);
            }
            var time = Date.now() * 0.00005;
            for (i = 0; i < this.scene.children.length; i++) {
                var object = this.scene.children[i];
                if (object instanceof THREE.PointCloud) {
                    object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
                }
            }
            for (i = 0; i < this.materials.length; i++) {
                this.color = this.parameters[i][0];
                this.h = (360 * (this.color[0] + time) % 360) / 360;
                this.materials[i].color.setHSL(this.h, this.color[1], this.color[2]);
            }
            var ttime = this.clock.getElapsedTime() * 10;
            for (i = 0, l = this.tgeometry.vertices.length; i < l; i++) {
                this.tgeometry.vertices[i].y = 35 * Math.sin(i / 5 + (ttime + i) / 7);
            }
            this.tmesh.geometry.verticesNeedUpdate = true;
            var delta = this.clock.getDelta();
            if (this.controlEnabled) {
                this.controls.update(delta);
            }
            this.effect.render(this.scene, this.camera);
        };
        Main.prototype.addWayPoint = function (x, y, z, randomRadius) {
            var p = new THREE.Vector3(x, y, z);
            for (var j = this.BRUSHES; j--;) {
                this.chain = this.chains[j];
                p = p.clone();
                p.y += (Math.random() - 0.5) * randomRadius;
                if (this.DIZZY) {
                    p.x += (Math.random() - 0.5) * randomRadius;
                    p.z += (Math.random() - 0.5) * randomRadius;
                }
                this.chain.points.push(p);
                this.points = this.chain.points;
                this.midpoint = p.clone();
                var l = this.points.length;
                if (l === 1) {
                    this.midpoint.add(p);
                }
                else {
                    this.midpoint.add(this.points[l - 2]);
                }
                this.midpoint.multiplyScalar(0.5);
                this.chain.midpoints.push(this.midpoint);
            }
        };
        Main.prototype.restart = function () {
            this.chains = [];
            for (var j = this.BRUSHES; j--;) {
                this.chains.push(new Chain());
            }
            for (var i = 0; i < this.POINTS; i++) {
                var randomRadius = 10.20 + Math.random() * 40;
                this.addWayPoint(this.SPREAD * (Math.random() - 0.5), this.SPREAD * (Math.random() - 0.5), this.SPREAD * (Math.random() - 0.5), randomRadius);
            }
            if (this.brushes.length) {
                for (var b = this.BRUSHES; b--;) {
                    var brush = this.brushes[b];
                    var lpoints = [];
                    for (i = 0; i < this.POINTS - 1; i++) {
                        this.chain = this.chains[b];
                        this.curve = this.chain.curve;
                        this.midpoints = this.chain.midpoints;
                        this.points = this.chain.points;
                        this.curve.v0 = this.midpoints[i];
                        this.curve.v1 = this.points[i];
                        this.curve.v2 = this.midpoints[i + 1];
                        for (j = 0; j < this.SUBDIVISIONS; j++) {
                            lpoints.push(this.curve.getPoint(j / this.SUBDIVISIONS));
                        }
                    }
                    brush.points = lpoints;
                }
            }
            this.t = 0;
        };
        Main.prototype.dizzy = function () {
            this.DIZZY = true;
            this.camera.setLens(16);
            this.SPEED = 0.5;
            this.restart();
            return false;
        };
        return Main;
    })();
    app.Main = Main;
    var Chain = (function () {
        function Chain() {
            this.points = [];
            this.midpoints = [];
            this.curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
        }
        return Chain;
    })();
    var Brush = (function () {
        function Brush() {
            this.geometry = new THREE.Geometry();
            this.points = [];
            this.colors = [];
            this.hueOffset = (Math.random() - 0.5) * 0.1;
        }
        return Brush;
    })();
})(app || (app = {}));
//# sourceMappingURL=Main.js.map