import couponModel, { ICoupon } from "../models/couponModel";
import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import { FilterQuery } from "mongoose";

export const createCoupon = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const {
            code,
            description,
            discount,
            expiryDate,
            usageLimit,
            maxDiscountAmount,
            minPurchaseAmount,
        } = req.body;

        if (
            !code ||
            !discount ||
            !expiryDate ||
            !usageLimit ||
            !maxDiscountAmount ||
            !minPurchaseAmount
        ) {
            logWarning("required parameter missing to create coupon");
            return res.status(400).json({
                success: false,
                message: "required parameter missing in request",
            });
        }

        await couponModel.create({
            code,
            description,
            discount,
            expiryDate,
            usageLimit,
            maxDiscountAmount,
            minPurchaseAmount,
        });

        return res
            .status(201)
            .json({ success: true, message: "coupon created successfully" });
    } catch (error) {
        logErrorMessage("Error while creating coupon");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "error while creating coupon" });
    }
};

export const fetchCoupons = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const {
            search,
            limit = 10,
            page = 1,
            sortBy = "usedBy.length",
        } = req.query;

        const filter: FilterQuery<ICoupon> = {};
        if (search) {
            filter.$or = [
                { code: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const couponList = await couponModel
            .find(filter)
            .sort({ expiryDate: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        const totalMatches = await couponModel.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: "coupon list successfully fetched",
            length: couponList.length,
            couponList,
            pages: Math.ceil(totalMatches / parseInt(limit as string)),
        });
    } catch (error) {
        logErrorMessage("Error while fetching coupons");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "error while fetching coupons" });
    }
};

export const changeCouponStatus = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        console.log(req.body);
        const { couponId, isActive } = req.body;
        if (!couponId) {
            logWarning("required paramerter missing in request");
            return res.status(400).json({
                success: false,
                message: "required parameter missing in request",
            });
        }

        await couponModel.findByIdAndUpdate(couponId, { isActive });
        return res
            .status(200)
            .json({ success: false, message: "coupon state updated" });
    } catch (error) {
        logErrorMessage("error while changing the state of coupon");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while changing coupon status",
        });
    }
};
