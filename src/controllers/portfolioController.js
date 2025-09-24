const { PortfolioItem, User } = require('../models');
const { handleError } = require('../utils/helpers');

// Get all portfolio items for a student
exports.getPortfolioItems = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const portfolioItems = await PortfolioItem.findAll({
            where: { student_id: studentId },
            include: [
                { model: User, as: 'Student', attributes: ['id', 'full_name', 'avatar_url'] }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.status(200).json({ success: true, data: portfolioItems });
    } catch (error) {
        handleError(res, error);
    }
};

// Get portfolio item by ID
exports.getPortfolioItemById = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const portfolioItem = await PortfolioItem.findByPk(itemId, {
            include: [
                { model: User, as: 'Student', attributes: ['id', 'full_name', 'avatar_url'] }
            ]
        });

        if (!portfolioItem) {
            return res.status(404).json({ success: false, message: 'Portfolio item not found' });
        }
        
        res.status(200).json({ success: true, data: portfolioItem });
    } catch (error) {
        handleError(res, error);
    }
};

// Add a new portfolio item
exports.createPortfolioItem = async (req, res) => {
    try {
        const { title, description, image_urls, project_url, technologies_used, student_id } = req.body;

        const portfolioItem = await PortfolioItem.create({
            title,
            description,
            image_urls,
            project_url,
            technologies_used,
            student_id
        });

        res.status(201).json({ 
            success: true, 
            message: 'Portfolio item created successfully',
            data: portfolioItem 
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Update portfolio item
exports.updatePortfolioItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { title, description, image_urls, project_url, technologies_used } = req.body;

        const portfolioItem = await PortfolioItem.findByPk(itemId);
        if (!portfolioItem) {
            return res.status(404).json({ success: false, message: 'Portfolio item not found' });
        }

        const updatedItem = await portfolioItem.update({
            title,
            description,
            image_urls,
            project_url,
            technologies_used
        });

        res.status(200).json({ 
            success: true, 
            message: 'Portfolio item updated successfully',
            data: updatedItem 
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete portfolio item
exports.deletePortfolioItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const portfolioItem = await PortfolioItem.findByPk(itemId);
        if (!portfolioItem) {
            return res.status(404).json({ success: false, message: 'Portfolio item not found' });
        }

        await portfolioItem.destroy();

        res.status(200).json({ 
            success: true, 
            message: 'Portfolio item deleted successfully' 
        });
    } catch (error) {
        handleError(res, error);
    }
};



// Update an existing portfolio item
exports.updatePortfolioItem = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description, imageUrls, projectUrl, technologiesUsed } = req.body;
        const itemId = req.params.itemId;

        const [updated] = await PortfolioItem.update(
            { title, description, imageUrls, projectUrl, technologiesUsed },
            { where: { id: itemId } }
        );

        if (updated) {
            const updatedItem = await PortfolioItem.findOne({ where: { id: itemId } });
            return res.status(200).json(updatedItem);
        }
        throw new Error('Item not found');
    } catch (error) {
        res.status(500).json({ message: 'Error updating portfolio item', error });
    }
};
