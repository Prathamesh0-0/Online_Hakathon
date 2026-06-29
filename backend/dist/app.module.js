"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma.module");
const auth_module_1 = require("./auth/auth.module");
const meetings_module_1 = require("./meetings/meetings.module");
const teams_module_1 = require("./teams/teams.module");
const email_module_1 = require("./email/email.module");
const integrations_module_1 = require("./integrations/integrations.module");
const livekit_module_1 = require("./livekit/livekit.module");
const recordings_module_1 = require("./recordings/recordings.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            meetings_module_1.MeetingsModule,
            teams_module_1.TeamsModule,
            email_module_1.EmailModule,
            integrations_module_1.IntegrationsModule,
            livekit_module_1.LivekitModule,
            recordings_module_1.RecordingsModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map