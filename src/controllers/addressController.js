import Address from "../models/address.js";

export const createAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      isDefault,
      addressType,
    } = req.body;

    const existingAddressesCount = await Address.countDocuments({
      user: req.user._id,
    });

    const shouldBeDefault = isDefault || existingAddressesCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country: country || "Nigeria",
      isDefault: shouldBeDefault,
      addressType: addressType || "home",
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Handle default status update
    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      address.isDefault = true;
    }

    address.fullName = req.body.fullName ?? address.fullName;
    address.phone = req.body.phone ?? address.phone;
    address.streetAddress = req.body.streetAddress ?? address.streetAddress;
    address.city = req.body.city ?? address.city;
    address.state = req.body.state ?? address.state;
    address.postalCode = req.body.postalCode ?? address.postalCode;
    address.country = req.body.country ?? address.country;
    address.addressType = req.body.addressType ?? address.addressType;

    const updatedAddress = await address.save();
    res.status(200).json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res
      .status(200)
      .json({ message: "Default address updated successfully", address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    if (wasDefault) {
      const latestAddress = await Address.findOne({ user: req.user._id }).sort({
        createdAt: -1,
      });
      if (latestAddress) {
        latestAddress.isDefault = true;
        await latestAddress.save();
      }
    }

    res.status(200).json({ message: "Address removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
