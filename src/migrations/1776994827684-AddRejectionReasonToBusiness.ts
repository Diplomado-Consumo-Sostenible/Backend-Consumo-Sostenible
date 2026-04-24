import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRejectionReasonToBusiness1776994827684 implements MigrationInterface {
    name = 'AddRejectionReasonToBusiness1776994827684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" ADD "rejectionReason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "rejectionReason"`);
    }

}
