import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase-config";
import styles from "./AdminUsers.module.scss";
import {
  RiUserSearchLine,
  RiShieldUserLine,
  RiSettings4Line,
  RiDeviceLine,
  RiMailLine,
  RiTimeLine,
  RiPhoneLine,
} from "react-icons/ri";
import toast from "react-hot-toast";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("email", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleAdminRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Rol actualizado a ${newRole.toUpperCase()}`);
    } catch (e) {
      toast.error("Error al cambiar privilegios");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return <div className={styles.loader}>Cargando directorio...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2>
            <RiShieldUserLine /> Directorio de Usuarios
          </h2>
          <p>Gestión de permisos y vinculación de hardware</p>
        </div>
        <div className={styles.searchBox}>
          <RiUserSearchLine />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Dispositivo Vinculado</th>
              <th>Miembro Desde</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatarMini}>
                      {user.nombre
                        ? user.nombre.charAt(0)
                        : user.email.charAt(0)}
                    </div>
                    <div className={styles.userNameInfo}>
                      <strong>
                        {user.nombre} {user.apellido || ""}
                      </strong>
                      <small>ID: {user.id.substring(0, 8)}...</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.contactCell}>
                    <span>
                      <RiMailLine /> {user.email}
                    </span>
                    {user.celular && (
                      <span>
                        <RiPhoneLine /> {user.celular}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={`${styles.roleBadge} ${styles[user.role || "user"]}`}
                  >
                    {user.role || "user"}
                  </span>
                </td>
                <td>
                  <div className={styles.deviceCountCell}>
                    {user.devices && user.devices.length > 0 ? (
                      <div
                        className={styles.deviceBadge}
                        title={`IDs: ${user.devices.join(", ")}`} // Tooltip nativo al pasar el mouse
                      >
                        <RiDeviceLine />
                        <span className={styles.countNumber}>
                          {user.devices.length}
                        </span>
                        <span className={styles.countText}>
                          {user.devices.length === 1 ? "Equipo" : "Equipos"}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.noDevices}>Sin equipos</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={styles.dateText}>
                    {user.createdAt
                      ? user.createdAt.toDate().toLocaleString("es-ES", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "N/A"}
                  </span>
                </td>
                <td>
                  <button
                    className={styles.btnActionRole}
                    onClick={() => toggleAdminRole(user.id, user.role)}
                    title={
                      user.role === "admin" ? "Quitar Admin" : "Hacer Admin"
                    }
                  >
                    <RiShieldUserLine />
                    <span>
                      {user.role === "admin" ? "Degradar" : "Ascender"}
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
