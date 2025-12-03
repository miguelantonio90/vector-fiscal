const { User, Obligation, Payment, Income } = require('../models');

/**
 * Obtener todos los usuarios (solo admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nit: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    
    // Obtener estadísticas de cada usuario
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [obligationsCount, paymentsCount, incomesCount] = await Promise.all([
        Obligation.countDocuments({ user: user._id }),
        Payment.countDocuments({ user: user._id }),
        Income.countDocuments({ user: user._id })
      ]);
      
      return {
        ...user.toObject(),
        stats: {
          obligations: obligationsCount,
          payments: paymentsCount,
          incomes: incomesCount
        }
      };
    }));
    
    res.json({
      users: usersWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener un usuario por ID (solo admin)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    // Obtener estadísticas detalladas
    const [obligationsCount, paymentsCount, incomesCount, totalPaid] = await Promise.all([
      Obligation.countDocuments({ user: user._id }),
      Payment.countDocuments({ user: user._id }),
      Income.countDocuments({ user: user._id }),
      Payment.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    res.json({
      ...user.toObject(),
      stats: {
        obligations: obligationsCount,
        payments: paymentsCount,
        incomes: incomesCount,
        totalPaid: totalPaid[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear un nuevo usuario (solo admin)
 */
const createUser = async (req, res) => {
  try {
    const { name, nit, password, role = 'user' } = req.body;
    
    // Validaciones
    if (!name || !nit || !password) {
      return res.status(400).json({ error: 'Nombre, NIT y contraseña son requeridos.' });
    }
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser "user" o "admin".' });
    }
    
    // Verificar si el NIT ya existe
    const existingUser = await User.findOne({ nit });
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario con este NIT.' });
    }
    
    // Crear usuario
    const user = new User({ name, nit, password, role });
    await user.save();
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user._id,
        nit: user.nit,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar un usuario (solo admin)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nit, role, password } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    // No permitir modificar al propio admin que hace la petición si intenta quitarse el rol admin
    if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({ error: 'No puedes quitarte el rol de administrador a ti mismo.' });
    }
    
    // Si el NIT cambió, verificar que no exista otro usuario con ese NIT
    if (nit && nit !== user.nit) {
      const existingUser = await User.findOne({ nit, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Ya existe otro usuario con este NIT.' });
      }
    }
    
    // Actualizar campos
    if (name) user.name = name;
    if (nit) user.nit = nit;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (password) user.password = password; // Se hasheará automáticamente por el pre-save hook
    
    await user.save();
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: user._id,
        nit: user.nit,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Eliminar un usuario (solo admin)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    // No permitir eliminar al propio admin
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
    }
    
    // Eliminar todos los datos asociados al usuario
    await Promise.all([
      Obligation.deleteMany({ user: id }),
      Payment.deleteMany({ user: id }),
      Income.deleteMany({ user: id }),
      User.findByIdAndDelete(id)
    ]);
    
    res.json({ message: 'Usuario y todos sus datos eliminados exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener estadísticas generales (solo admin)
 */
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalObligations,
      totalPayments,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      Obligation.countDocuments(),
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5)
    ]);
    
    res.json({
      users: {
        total: totalUsers + totalAdmins,
        regular: totalUsers,
        admins: totalAdmins
      },
      obligations: {
        total: totalObligations
      },
      payments: {
        count: totalPayments[0]?.count || 0,
        total: totalPayments[0]?.total || 0
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getStats
};

