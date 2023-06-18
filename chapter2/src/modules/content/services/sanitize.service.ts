import { Injectable } from "@nestjs/common";

@Injectable
export class SanitizeService{
    protected config: sanitizeHtml.IOptions = {};

    constructor(){
        this.config = {
            allow
        };
    }
}