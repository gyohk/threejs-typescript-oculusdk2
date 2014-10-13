///<reference path="../typings/tsd.d.ts" />

declare module THREE {
    var OculusRiftEffect: any;
    var DK2Controls: any;
}

module app {
    "use strict";

    export class Main {
        private renderer:THREE.WebGLRenderer;
        private scene:THREE.Scene;
        private camera:THREE.PerspectiveCamera;

        private cube:THREE.Mesh;
        private clock: THREE.Clock;
        private effect: any;
        private controls: any;

        constructor() {
            this.initTHREE();
            this.initScene();
            this.render();
        }

        private initTHREE():void {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(110, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.scene.add(this.camera);
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById("container").appendChild(this.renderer.domElement);
        }

        private initScene():void {
            this.clock = new THREE.Clock();
            this.controls = new THREE.DK2Controls(this.camera);
            this.effect = new THREE.OculusRiftEffect(this.renderer, {scale:1.0});
            this.effect.setSize( window.innerWidth, window.innerHeight );
            var geometry = new THREE.BoxGeometry(1, 1, 1);
            var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
            this.cube = new THREE.Mesh(geometry, material);
            this.scene.add(this.cube);

        }

        public render():void {
            requestAnimationFrame(() => this.render());

            this.cube.rotation.x += 0.05;
            this.cube.rotation.y += 0.05;
            // this.controls.controller.position.x += 0.05;

            var delta = this.clock.getDelta();
            this.controls.update(delta);

            this.effect.render(this.scene,this.camera);
            // this.renderer.render(this.scene, this.camera);
        }
    }
}
